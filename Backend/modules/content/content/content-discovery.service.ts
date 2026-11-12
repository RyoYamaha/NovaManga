import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryRankingContentDto, type RankingCategory } from './dto/query-ranking-content.dto';
import { QueryRecommendationsDto } from './dto/query-recommendations.dto';
import { PublicationStatus } from '../../../common/constants/content.enum';
import { communityTranslationVisibilityWhere } from './content-visibility';

// Xem như mỗi truyện bắt đầu với 5 lượt đánh giá có điểm bằng trung bình chung.
const RATING_PRIOR_COUNT = 5;
const RECOMMENDATION_RELEVANCE_WEIGHT = 0.8;
const RECOMMENDATION_DIVERSITY_WEIGHT = 0.2;
const DIVERSITY_CANDIDATE_POOL_SIZE = 100;

type RecommendationCandidate = {
    content: {
        id: string;
        genres: { genreId: string }[];
        tags: { tagId: string }[];
    };
    recommendationScore: number;
};

function calculateBayesianRating(average: number, count: number, priorAverage: number): number {
    return (
        (count * average + RATING_PRIOR_COUNT * priorAverage) /
        (count + RATING_PRIOR_COUNT)
    );
}

function jaccardSimilarity(firstIds: string[], secondIds: string[]): number {
    const first = new Set(firstIds);
    const second = new Set(secondIds);
    const unionSize = new Set([...first, ...second]).size;
    if (unionSize === 0) return 0;

    let intersectionSize = 0;
    for (const id of first) {
        if (second.has(id)) intersectionSize += 1;
    }

    return intersectionSize / unionSize;
}

function recommendationSimilarity(
    first: RecommendationCandidate,
    second: RecommendationCandidate,
): number {
    const genreSimilarity = jaccardSimilarity(
        first.content.genres.map(({ genreId }) => genreId),
        second.content.genres.map(({ genreId }) => genreId),
    );
    const tagSimilarity = jaccardSimilarity(
        first.content.tags.map(({ tagId }) => tagId),
        second.content.tags.map(({ tagId }) => tagId),
    );

    return 0.6 * genreSimilarity + 0.4 * tagSimilarity;
}

function diversifyTopRecommendations<T extends RecommendationCandidate>(candidates: T[]): T[] {
    // Chỉ đa dạng hóa nhóm đầu để giữ chi phí tính toán ở mức có giới hạn.
    const poolSize = Math.min(candidates.length, DIVERSITY_CANDIDATE_POOL_SIZE);
    const remaining = candidates.slice(0, poolSize);
    const selected: T[] = [];

    while (remaining.length > 0) {
        let bestIndex = 0;
        let bestScore = Number.NEGATIVE_INFINITY;

        for (let index = 0; index < remaining.length; index += 1) {
            const candidate = remaining[index];
            const maxSimilarity = selected.reduce(
                (maximum, selectedCandidate) =>
                    Math.max(maximum, recommendationSimilarity(candidate, selectedCandidate)),
                0,
            );
            const score =
                RECOMMENDATION_RELEVANCE_WEIGHT * candidate.recommendationScore +
                RECOMMENDATION_DIVERSITY_WEIGHT * (1 - maxSimilarity);
            const bestCandidate = remaining[bestIndex];

            if (
                score > bestScore ||
                (score === bestScore &&
                    (candidate.recommendationScore > bestCandidate.recommendationScore ||
                        (candidate.recommendationScore === bestCandidate.recommendationScore &&
                            candidate.content.id.localeCompare(bestCandidate.content.id) < 0)))
            ) {
                bestIndex = index;
                bestScore = score;
            }
        }

        selected.push(remaining.splice(bestIndex, 1)[0]);
    }

    return [...selected, ...candidates.slice(poolSize)];
}

@Injectable()
export class ContentDiscoveryService {
  private static readonly POPULARITY_WINDOW_DAYS = 7;

  constructor(private readonly prisma: PrismaService) {}

  // Rank content using recent readers, favorites, bookmarks, and ratings.
  async getRankedContents(rankingQuery: QueryRankingContentDto): Promise<{
        items: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        popularityWindowDays: number;
    }> {
        // Bước 1: lấy số trang/kích thước trang và lấy số độc giả đã đọc gần đây
        // theo danh mục (Đang ra, Manga hoặc Novel).
        const pageNumber = rankingQuery.page ?? 1;
        const pageSize = rankingQuery.limit ?? 20;
        const recentContentReadCounts = await this.getRecentContentReadCounts(rankingQuery.category);
        // Tách ID truyện để dùng giới hạn các truy vấn thống kê tiếp theo đúng nhóm truyện này.
        const contentIds = recentContentReadCounts.map(({ contentId }) => contentId);

        // Nếu không có truyện nào có lượt đọc trong khoảng thời gian xét, trả danh sách rỗng.
        if (contentIds.length === 0) {
            return {
                items: [],
                meta: {
                    page: pageNumber,
                    limit: pageSize,
                    total: 0,
                    totalPages: 0,
                },
                popularityWindowDays: ContentDiscoveryService.POPULARITY_WINDOW_DAYS,
            };
        }
        // Bước 2: chạy đồng thời các truy vấn thống kê yêu thích, bookmark và rating.
        // Ba truy vấn groupBy chỉ xét các truyện trong contentIds; aggregate cuối lấy
        // điểm rating trung bình toàn hệ thống để làm mốc điều chỉnh rating từng truyện.
        const [favoriteGroups, bookmarkGroups, ratingGroups, overallRating] = await Promise.all([
            this.prisma.favorite.groupBy({
                by: ['contentId'],
                where: { contentId: { in: contentIds } },
                _count: { userId: true },
            }),
            this.prisma.bookmark.groupBy({
                by: ['contentId'],
                where: { contentId: { in: contentIds } },
                _count: { userId: true },
            }),
            this.prisma.rating.groupBy({
                by: ['contentId'],
                where: { contentId: { in: contentIds } },
                _avg: { score: true },
                _count: { score: true },
            }),
            this.prisma.rating.aggregate({ _avg: { score: true } }), //rating toàn hệ thống 
        ]);

        // Đổi kết quả groupBy thành Map dạng contentId -> số lượng để tra cứu nhanh khi chấm điểm.
        const favoritesByContent = new Map(favoriteGroups.map(({ contentId, _count }) => [contentId, _count.userId]));
        const bookmarksByContent = new Map(bookmarkGroups.map(({ contentId, _count }) => [contentId, _count.userId]));
        // Nếu chưa có rating nào trong hệ thống thì dùng 0 làm điểm trung bình chung.
        const priorAverage = overallRating._avg.score ?? 0;

        // Điều chỉnh rating từng truyện theo số lượt đánh giá, tránh vài đánh giá ít ỏi
        // làm điểm truyện cao/thấp bất thường; kết quả Map có dạng contentId -> rating đã điều chỉnh.
        const ratingsByContent = new Map(
            ratingGroups.map(({ contentId, _avg, _count }) => [
                contentId,
                calculateBayesianRating(_avg.score ?? priorAverage, _count.score, priorAverage),
            ]),
        );

        // Lấy giá trị lớn nhất của từng tín hiệu để chuẩn hóa về cùng thang điểm.
        //mỗi biến giữ số lớn nhất của từng tín hiệu tương ứng 
    
        // Dùng 1 làm giá trị tối thiểu để mẫu số không bằng 0 khi không có thống kê.
        const maxReads = Math.max(...recentContentReadCounts.map(({ activeReaderCount }) => activeReaderCount), 1);
        const maxFavorites = Math.max(...favoriteGroups.map(({ _count }) => _count.userId), 1);
        const maxBookmarks = Math.max(...bookmarkGroups.map(({ _count }) => _count.userId), 1);

        // Bước 3: với mỗi truyện, ghép lượt đọc/yêu thích/bookmark/rating theo contentId,
        // xếp hạng đổ phổ biến , dùng logarit để tránh ảnh hưởng của số quá cao 
        const rankedContentReadCounts = recentContentReadCounts
            .map((item) => {
            const reads = item.activeReaderCount;
            const favorites = favoritesByContent.get(item.contentId) ?? 0;
            const bookmarks = bookmarksByContent.get(item.contentId) ?? 0;
            const rating = ratingsByContent.get(item.contentId) ?? priorAverage;
            // Trọng số: lượt đọc 55%, yêu thích 20%, bookmark 10%, rating 15%.
            const popularityScore = 0.55 * Math.log1p(reads) / Math.log1p(maxReads) +
                0.2 * Math.log1p(favorites) / Math.log1p(maxFavorites) +
                0.1 * Math.log1p(bookmarks) / Math.log1p(maxBookmarks) +
                0.15 * rating / 5;
            return { ...item, popularityScore };
        })
            // Điểm cao đứng trước; nếu hòa thì so lượt đọc, cuối cùng dùng ID để ổn định thứ tự.
            .sort((first, second) => second.popularityScore - first.popularityScore ||
            second.activeReaderCount - first.activeReaderCount ||
            first.contentId.localeCompare(second.contentId));

        // Bước 4: mỗi trang hiển thị từ truyện số mấy đến tryện số mấy 
        const currentPageContentReadCounts = rankedContentReadCounts.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
        //                                                               vị trí bắt đầu                 vị trí kết thúc
        //pagenumber là số trang người dùng đang chọn 
        //pagesize là mỗi trang hiển thị bao nhiêu truyện  



        // Lấy ID của tất cả truyện trong trang hiện tại để chỉ truy vấn thông tin chi tiết cho các truyện sắp trả về.
        const pageContentIds = currentPageContentReadCounts.map((contentReadCount) => contentReadCount.contentId);

        //  { contentId: "A", activeReaderCount: 1000 }, đầu vào  ->> pageContentIds = ["A", "B", "C"];
        //{ contentId: "B", activeReaderCount: 500 },
        //  { contentId: "C", activeReaderCount: 200 }

        // Bước 5: lấy thông tin hiển thị (truyện, thể loại, tag, người đăng) từ database.
        const contentRecords = await this.prisma.content.findMany({
            where: { id: { in: pageContentIds }, AND: [this.communityTranslationVisibilityFilter()], },
            include: {
                genres: { include: { genre: true } },
                tags: { include: { tag: true } },
                uploader: { select: { id: true, username: true } },
            },
        });

        // Lập bảng tra contentId -> bản ghi đầy đủ; truy vấn DB không đảm bảo giữ thứ tự ID,
        // nên phía dưới duyệt theo danh sách đã xếp hạng để giữ đúng thứ tự trên bảng.
        const contentById = new Map(contentRecords.map((contentRecord) => [contentRecord.id, contentRecord]));
        const items = [];
        for (const contentReadCount of currentPageContentReadCounts) {
            const content = contentById.get(contentReadCount.contentId);
            // Bỏ qua nếu bản ghi không còn tồn tại hoặc không vượt qua điều kiện hiển thị.
            if (!content) {
                continue;
            }
            items.push({
                ...content,
                // Gắn số độc giả hoạt động gần đây để Frontend hiển thị cùng truyện.
                activeReaders: contentReadCount.activeReaderCount,
            });
        }

        // Bước 6: trả danh sách đã xếp hạng, thông tin phân trang và độ dài cửa sổ thống kê.
        return {
            items: items,
            meta: {
                page: pageNumber,
                limit: pageSize,
                total: rankedContentReadCounts.length,
                totalPages: Math.ceil(rankedContentReadCounts.length / pageSize),
            },
            popularityWindowDays: ContentDiscoveryService.POPULARITY_WINDOW_DAYS,
        };
    }

  // Build personalized recommendations from the reader's history and preferences.
  async getRecommendations(userId: string, query: QueryRecommendationsDto): Promise<{
        items: any[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        fallback: boolean;
    }> {
        // Bước 1: đọc tham số phân trang; nếu request không gửi thì dùng trang 1, mỗi trang 20 truyện.
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;

        // Bước 2: lấy dữ liệu hình thành hồ sơ sở thích. Promise.all chạy các truy vấn độc lập song song:
        // - toàn bộ thể loại người dùng đã chọn;
        // - 30 tiến độ đọc có lastReadAt mới nhất;
        // - 30 lượt yêu thích có createdAt mới nhất;
        // - 30 bookmark có createdAt mới nhất.
        const [preferences, recentHistory, favoriteHistory, bookmarkHistory] = await Promise.all([
            this.prisma.userGenrePreference.findMany({ where: { userId }, select: { genreId: true } }),
            this.prisma.readingProgress.findMany({
                where: { userId },
                orderBy: { lastReadAt: 'desc' },
                take: 30,
                select: { contentId: true, lastReadAt: true },
            }),
            this.prisma.favorite.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 30,
                select: { contentId: true, createdAt: true },
            }),
            this.prisma.bookmark.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 30,
                select: { contentId: true, createdAt: true },
            }),
        ]);

        // Bước 3: tạo bảng điểm sở thích. Mỗi thể loại người dùng đã chọn được cấp điểm nền là 3;
        // tag chưa có điểm ban đầu, sẽ được cộng điểm từ các truyện trong lịch sử.
        const genreIds = preferences.map(({ genreId }) => genreId);


        const genreInterests = new Map(genreIds.map((id) => [id, 3]));
        const tagInterests = new Map();

        // Lấy contentId từ cả ba nguồn tương tác rồi gộp thành một danh sách duy nhất.
        // Set loại ID trùng để mỗi truyện chỉ cần tải genres/tags một lần; các tương tác riêng
        // (đọc, yêu thích, bookmark) vẫn được tính riêng ở bước cộng điểm phía dưới.
        const historyContentIds = [...new Set([
                ...recentHistory.map(({ contentId }) => contentId),
                ...favoriteHistory.map(({ contentId }) => contentId),
                ...bookmarkHistory.map(({ contentId }) => contentId),
            ])];
            // gộp tất cả lại 1 mảng, các phần tử trùng lặp được gộp lại thành 1 

        // Chỉ truy vấn bảng Content khi thật sự có ID lịch sử. Lấy các genreId/tagId cần thiết
        // để suy ra sở thích từ những truyện người dùng từng tương tác.
        const historyContents = historyContentIds.length
            ? await this.prisma.content.findMany({
                where: { id: { in: historyContentIds } },
                select: {
                    id: true,
                    genres: { select: { genreId: true } },
                    tags: { select: { tagId: true } },
                },
            })
            : [];

        // Tạo bảng tra cứu nhanh: contentId -> thông tin truyện cùng thể loại và tag của truyện đó.
        const historyById = new Map(historyContents.map((content) => [content.id, content]));

        // Hàm cộng điểm sở thích từ một nhóm tương tác (đọc/yêu thích/bookmark).
        const addHistoryInterests = (interactions, baseWeight) => {
            for (const interaction of interactions) {
                const content = historyById.get(interaction.contentId);
                if (!content)
                    continue;

                // Lượt tương tác càng cũ thì trọng số càng nhỏ: cứ 30 ngày giảm còn một nửa.
                const interactionAt = interaction.lastReadAt ?? interaction.createdAt ?? new Date();
                // Nó sẽ lấy giá trị đầu tiên không phải null hoặc undefined.

                //tính số ngày kể từ lân tương tác , tính theo mili giây 

                const ageInDays = Math.max(0, (Date.now() - interactionAt.getTime()) / (24 * 60 * 60 * 1000));
                //chia ra để ra số ngày , vd: 1 2 ngày chứ không phải mili giâyy nữa 
                //dùng math max để nó luôn chọn giá trị lớn hơn 0
                //giả sử giá trị ở sau bằng âm thì nó lấy luôn 0 để đảm bảo an toàn 
                const weight = baseWeight * Math.pow(0.5, ageInDays / 30);

                // Cộng trọng số vào tất cả thể loại/tag của truyện.
                // Nếu một thể loại/tag đã có điểm (từ sở thích chọn trước đó hoặc truyện khác),
                // cộng dồn vào điểm hiện tại thay vì ghi đè.
                for (const { genreId } of content.genres) {
                    genreInterests.set(genreId, (genreInterests.get(genreId) ?? 0) + weight);
                }
                for (const { tagId } of content.tags) {
                    tagInterests.set(tagId, (tagInterests.get(tagId) ?? 0) + weight);
                }
            }
        };

        // Điểm cơ sở: đọc = 3, yêu thích = 3, bookmark = 2.
        addHistoryInterests(recentHistory, 3);
        addHistoryInterests(favoriteHistory, 3);
        addHistoryInterests(bookmarkHistory, 2);

        // Bước 4: xác định mốc thời gian dùng để tính độ phổ biến (7 ngày gần nhất).
        const recentWindowStart = new Date(Date.now() - ContentDiscoveryService.POPULARITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);

        // Chỉ đề xuất nội dung đã xuất bản/được phép hiển thị và người dùng chưa đọc,
        // chưa bookmark, chưa yêu thích. Các điều kiện quan hệ này loại mọi tương tác,
        // không chỉ 30 bản ghi đã lấy để xây dựng hồ sơ sở thích.
        const contentFilter: Prisma.ContentWhereInput = {
            publicationStatus: PublicationStatus.Published,
            AND: [this.communityTranslationVisibilityFilter()],
            readingProgress: { none: { userId } },
            bookmarks: { none: { userId } },
            favorites: { none: { userId } },
        };

        // Tải các ứng viên cùng dữ liệu cần hiển thị và chấm mức phù hợp thể loại/tag.
        const candidates = await this.prisma.content.findMany({
            where: contentFilter,
            include: {
                genres: { include: { genre: true } },
                tags: { include: { tag: true } },
                uploader: { select: { id: true, username: true } },
            },
        });

        // Tách ID ứng viên để giới hạn các truy vấn thống kê rating/lượt đọc đúng tập này.
        const contentIds = candidates.map(({ id }) => id);
        if (contentIds.length === 0) {
            // Không có nội dung hợp lệ thì trả danh sách rỗng; fallback cho biết hồ sơ có sở thích hay không.
            return {
                items: [],
                meta: { page, limit, total: 0, totalPages: 0 },
                fallback: genreInterests.size === 0 && tagInterests.size === 0,
            };
        }

        // Bước 5: thống kê từng ứng viên. Các truy vấn chạy song song:
        // rating trung bình/số lượng theo truyện, số độc giả trong 7 ngày,
        // và rating trung bình toàn hệ thống để làm mốc điều chỉnh.
        const [ratingGroups, readGroups, overallRating] = await Promise.all([
            this.prisma.rating.groupBy({
                by: ['contentId'],
                where: { contentId: { in: contentIds } },
                _avg: { score: true },
                _count: { score: true },
            }),
            this.prisma.readingProgress.groupBy({
                by: ['contentId'],
                where: {
                    contentId: { in: contentIds },
                    lastReadAt: { gte: recentWindowStart },
                },
                _count: { userId: true },
            }),
            this.prisma.rating.aggregate({ _avg: { score: true }             }),
        ]);

        // Nếu hệ thống chưa có rating nào thì dùng 0 làm điểm trung bình chung.
        const priorAverage = overallRating._avg.score ?? 0;

        // Lập bảng contentId -> rating thô và rating Bayesian đã điều chỉnh.
        // Rating điều chỉnh giúp một truyện ít lượt đánh giá không bị biến động quá mạnh.
        const ratingsByContentId = new Map(
            ratingGroups.map(({ contentId, _avg, _count }) => [
                contentId,
                {
                    average: _avg.score ?? 0,
                    adjusted: calculateBayesianRating(_avg.score ?? priorAverage, _count.score, priorAverage),
                },
            ]),
        );

        // Lập bảng contentId -> số lượt đọc gần đây; maxReads dùng để chuẩn hóa độ phổ biến.
        const readsByContentId = new Map(readGroups.map(({ contentId, _count }) => [contentId, _count.userId]));
        const maxReads = Math.max(...readsByContentId.values(), 1);

        // Tổng điểm sở thích dùng làm mẫu số khi chuẩn hóa độ khớp thể loại/tag.
        // Math.max(..., 1) tránh chia cho 0 nếu không có sở thích tương ứng.
        const totalGenreInterest = Math.max([...genreInterests.values()].reduce((total, weight) => total + weight, 0), 1);
        const totalTagInterest = Math.max([...tagInterests.values()].reduce((total, weight) => total + weight, 0), 1);

        // Có sở thích nếu người dùng đã chọn thể loại hoặc lịch sử tạo ra điểm tag/thể loại.
        const hasInterests = genreInterests.size > 0 || tagInterests.size > 0;
        const rankedCandidates = [];

        // Bước 6: tính các tín hiệu và điểm gợi ý cho từng truyện ứng viên.
        for (const content of candidates) {
            // Đây là số lượng thể loại/tag khớp, dùng bổ sung trong response cho giao diện.
            const matchingGenres = content.genres.filter(({ genreId }) => genreInterests.has(genreId)).length;
            const matchingTags = content.tags.filter(({ tagId }) => tagInterests.has(tagId)).length;

            // Điểm khớp là tổng mức quan tâm của thể loại/tag có trong truyện,
            // chia cho tổng mức quan tâm của người dùng ở loại tương ứng.
            const genreScore = content.genres.reduce((score, { genreId }) => score + (genreInterests.get(genreId) ?? 0), 0) / totalGenreInterest;
            const tagScore = content.tags.reduce((score, { tagId }) => score + (tagInterests.get(tagId) ?? 0), 0) / totalTagInterest;

            // Nếu truyện không có bản ghi rating, dùng trung bình chung làm rating điều chỉnh.
            const rating = ratingsByContentId.get(content.id) ?? {
                average: 0,
                adjusted: priorAverage,
            };
            const recentReads = readsByContentId.get(content.id) ?? 0;

            // Chuẩn hóa lượt đọc bằng log để giảm chênh lệch giữa truyện cực phổ biến và truyện khác.
            const popularityScore = Math.log1p(recentReads) / Math.log1p(maxReads);

            // Độ mới giảm theo hàm mũ: truyện mới gần 1, truyện càng cũ thì điểm càng thấp.
            const ageInDays = Math.max(0, (Date.now() - content.createdAt.getTime()) / (24 * 60 * 60 * 1000));
            const freshnessScore = Math.exp(-ageInDays / 60);

            // Có sở thích thì ưu tiên độ khớp; nếu chưa có thì dựa vào phổ biến, rating và độ mới.
            const recommendationScore = hasInterests
                ? 0.4 * genreScore + 0.15 * tagScore + 0.2 * popularityScore + 0.2 * (rating.adjusted / 5) + 0.05 * freshnessScore
                : 0.55 * popularityScore + 0.35 * (rating.adjusted / 5) + 0.1 * freshnessScore;
            rankedCandidates.push({
                content,
                matchingGenres,
                matchingTags,
                rating: rating.average,
                recentReads,
                recommendationScore,
            });
        }

        // Xếp điểm cao trước; nếu bằng điểm thì dùng ID để kết quả có thứ tự ổn định.
        rankedCandidates.sort((first, second) => second.recommendationScore - first.recommendationScore ||
            first.content.id.localeCompare(second.content.id));

        // Bước 7: điều chỉnh thứ tự tối đa 100 truyện đầu để cân bằng độ phù hợp và độ đa dạng.
        const diverseCandidates = diversifyTopRecommendations(rankedCandidates);

        // Bước 8: chỉ lấy đoạn tương ứng với trang yêu cầu sau khi đã xếp hạng/đa dạng hóa.
        const pageItems = diverseCandidates.slice((page - 1) * limit, page * limit);

        // Trả dữ liệu truyện cùng các trường bổ sung để giao diện hiển thị.
        return {
            items: pageItems.map(({ content, matchingGenres, matchingTags, rating, recentReads }) => ({
                ...content,
                matchingGenres,
                matchingTags,
                averageRating: rating,
                activeReaders: recentReads,
            })),
            meta: {
                page,
                limit,
                // Tổng là số ứng viên đủ điều kiện trước phân trang.
                total: rankedCandidates.length,
                totalPages: Math.ceil(rankedCandidates.length / limit),
            },
            // true nghĩa là không có thể loại/tag để cá nhân hóa, nên dùng công thức fallback.
            fallback: !hasInterests,
        };
    }

  // Find published content with the strongest genre and tag overlap.
  async getSimilarContents(contentId: string): Promise<({
        uploader: {
            id: string;
            username: string;
        };
        genres: ({
            genre: {
                id: string;
                name: string;
            };
        } & {
            contentId: string;
            genreId: string;
        })[];
        tags: ({
            tag: {
                id: string;
                name: string;
            };
        } & {
            contentId: string;
            tagId: string;
        })[];
    } & {
        id: string;
        title: string;
        synopsis: string | null;
        type: string;
        ownershipTier: string;
        publicationStatus: string;
        reviewFeedback: string | null;
        aiModerationStatus: string | null;
        aiModerationReason: string | null;
        aiModeratedAt: Date | null;
        storyStatus: string;
        coverImageUrl: string | null;
        pricingType: string;
        priceCoins: number;
        freeChapters: number;
        allowCommunityTranslation: boolean;
        pricingChangedAt: Date | null;
        uploaderId: string;
        publisherId: string | null;
        parentContentId: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]> {
        const content = await this.prisma.content.findFirst({
            where: {
                id: contentId,
                publicationStatus: PublicationStatus.Published,
                AND: [this.communityTranslationVisibilityFilter()],
            },
            select: {
                id: true,
                type: true,
                genres: { select: { genreId: true } },
                tags: { select: { tagId: true } },
            },
        });
        if (!content)
            throw new NotFoundException('Không tìm thấy Content');
        const genreIds = content.genres.map(({ genreId }) => genreId);
        const tagIds = content.tags.map(({ tagId }) => tagId);
        if (genreIds.length === 0 && tagIds.length === 0)
            return [];
        const candidates = await this.prisma.content.findMany({
            where: {
                id: { not: contentId },
                type: content.type,
                publicationStatus: PublicationStatus.Published,
                AND: [this.communityTranslationVisibilityFilter()],
                OR: [
                    ...(genreIds.length ? [{ genres: { some: { genreId: { in: genreIds } } } }] : []),
                    ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
                ],
            },
            include: {
                genres: { include: { genre: true } },
                tags: { include: { tag: true } },
                uploader: { select: { id: true, username: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        return candidates
            .map((candidate) => {
            const matchingGenres = candidate.genres.filter(({ genreId }) => genreIds.includes(genreId)).length;
            const matchingTags = candidate.tags.filter(({ tagId }) => tagIds.includes(tagId)).length;
            const similarityScore = (genreIds.length ? 0.6 * matchingGenres / genreIds.length : 0) +
                (tagIds.length ? 0.4 * matchingTags / tagIds.length : 0);
            return { content: candidate, similarityScore };
        })
            .sort((first, second) => second.similarityScore - first.similarityScore ||
            second.content.createdAt.getTime() - first.content.createdAt.getTime())
            .slice(0, 6)
            .map(({ content: similarContent }) => similarContent);
    }

  // Count recent reading activity within the existing popularity window.
  async getRecentContentReadCounts(rankingCategory?: RankingCategory): Promise<{ contentId: string; activeReaderCount: number }[]> {
        const contentFilter: Prisma.ContentWhereInput = { publicationStatus: PublicationStatus.Published,
            AND: [this.communityTranslationVisibilityFilter()], };
        if (rankingCategory === 'ongoing') {
            contentFilter.storyStatus = 'Ongoing';
        }
        if (rankingCategory === 'popular-manga') {
            contentFilter.type = 'Manga';
        }
        if (rankingCategory === 'popular-novel') {
            contentFilter.type = 'Novel';
        }
        const popularityWindowStart = new Date(Date.now() - ContentDiscoveryService.POPULARITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const contentReadCounts = await this.prisma.readingProgress.groupBy({
            by: ['contentId'],
            where: { lastReadAt: { gte: popularityWindowStart }, content: { is: contentFilter }, },
            _count: { userId: true },
        });
        return contentReadCounts.map((contentReadCount) => ({ contentId: contentReadCount.contentId, activeReaderCount: contentReadCount._count.userId, }));
    }

  private communityTranslationVisibilityFilter(): Prisma.ContentWhereInput {
        return communityTranslationVisibilityWhere();
    }
}
