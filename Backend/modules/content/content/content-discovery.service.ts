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
        const pageNumber = rankingQuery.page ?? 1;
        const pageSize = rankingQuery.limit ?? 20;
        const recentContentReadCounts = await this.getRecentContentReadCounts(rankingQuery.category);
        const contentIds = recentContentReadCounts.map(({ contentId }) => contentId);
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
            this.prisma.rating.aggregate({ _avg: { score: true } }),
        ]);
        const favoritesByContent = new Map(favoriteGroups.map(({ contentId, _count }) => [contentId, _count.userId]));
        const bookmarksByContent = new Map(bookmarkGroups.map(({ contentId, _count }) => [contentId, _count.userId]));
        const priorAverage = overallRating._avg.score ?? 0;
        const ratingsByContent = new Map(
            ratingGroups.map(({ contentId, _avg, _count }) => [
                contentId,
                calculateBayesianRating(_avg.score ?? priorAverage, _count.score, priorAverage),
            ]),
        );
        const maxReads = Math.max(...recentContentReadCounts.map(({ activeReaderCount }) => activeReaderCount), 1);
        const maxFavorites = Math.max(...favoriteGroups.map(({ _count }) => _count.userId), 1);
        const maxBookmarks = Math.max(...bookmarkGroups.map(({ _count }) => _count.userId), 1);
        const rankedContentReadCounts = recentContentReadCounts
            .map((item) => {
            const reads = item.activeReaderCount;
            const favorites = favoritesByContent.get(item.contentId) ?? 0;
            const bookmarks = bookmarksByContent.get(item.contentId) ?? 0;
            const rating = ratingsByContent.get(item.contentId) ?? priorAverage;
            const popularityScore = 0.55 * Math.log1p(reads) / Math.log1p(maxReads) +
                0.2 * Math.log1p(favorites) / Math.log1p(maxFavorites) +
                0.1 * Math.log1p(bookmarks) / Math.log1p(maxBookmarks) +
                0.15 * rating / 5;
            return { ...item, popularityScore };
        })
            .sort((first, second) => second.popularityScore - first.popularityScore ||
            second.activeReaderCount - first.activeReaderCount ||
            first.contentId.localeCompare(second.contentId));
        const currentPageContentReadCounts = rankedContentReadCounts.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);
        const pageContentIds = currentPageContentReadCounts.map((contentReadCount) => contentReadCount.contentId);
        const contentRecords = await this.prisma.content.findMany({
            where: { id: { in: pageContentIds }, AND: [this.communityTranslationVisibilityFilter()], },
            include: {
                genres: { include: { genre: true } },
                tags: { include: { tag: true } },
                uploader: { select: { id: true, username: true } },
            },
        });
        const contentById = new Map(contentRecords.map((contentRecord) => [contentRecord.id, contentRecord]));
        const items = [];
        for (const contentReadCount of currentPageContentReadCounts) {
            const content = contentById.get(contentReadCount.contentId);
            if (!content) {
                continue;
            }
            items.push({
                ...content,
                activeReaders: contentReadCount.activeReaderCount,
            });
        }
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
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
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
        const genreIds = preferences.map(({ genreId }) => genreId);
        const genreInterests = new Map(genreIds.map((id) => [id, 3]));
        const tagInterests = new Map();
        const historyContentIds = [...new Set([
                ...recentHistory.map(({ contentId }) => contentId),
                ...favoriteHistory.map(({ contentId }) => contentId),
                ...bookmarkHistory.map(({ contentId }) => contentId),
            ])];
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
        const historyById = new Map(historyContents.map((content) => [content.id, content]));
        const addHistoryInterests = (interactions, baseWeight) => {
            for (const interaction of interactions) {
                const content = historyById.get(interaction.contentId);
                if (!content)
                    continue;
                const interactionAt = interaction.lastReadAt ?? interaction.createdAt ?? new Date();
                const ageInDays = Math.max(0, (Date.now() - interactionAt.getTime()) / (24 * 60 * 60 * 1000));
                const weight = baseWeight * Math.pow(0.5, ageInDays / 30);
                for (const { genreId } of content.genres) {
                    genreInterests.set(genreId, (genreInterests.get(genreId) ?? 0) + weight);
                }
                for (const { tagId } of content.tags) {
                    tagInterests.set(tagId, (tagInterests.get(tagId) ?? 0) + weight);
                }
            }
        };
        addHistoryInterests(recentHistory, 3);
        addHistoryInterests(favoriteHistory, 3);
        addHistoryInterests(bookmarkHistory, 2);
        const recentWindowStart = new Date(Date.now() - ContentDiscoveryService.POPULARITY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
        const contentFilter: Prisma.ContentWhereInput = {
            publicationStatus: PublicationStatus.Published,
            AND: [this.communityTranslationVisibilityFilter()],
            readingProgress: { none: { userId } },
            bookmarks: { none: { userId } },
            favorites: { none: { userId } },
        };
        const candidates = await this.prisma.content.findMany({
            where: contentFilter,
            include: {
                genres: { include: { genre: true } },
                tags: { include: { tag: true } },
                uploader: { select: { id: true, username: true } },
            },
        });
        const contentIds = candidates.map(({ id }) => id);
        if (contentIds.length === 0) {
            return {
                items: [],
                meta: { page, limit, total: 0, totalPages: 0 },
                fallback: genreInterests.size === 0 && tagInterests.size === 0,
            };
        }
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
            this.prisma.rating.aggregate({ _avg: { score: true } }),
        ]);
        const priorAverage = overallRating._avg.score ?? 0;
        const ratingsByContentId = new Map(
            ratingGroups.map(({ contentId, _avg, _count }) => [
                contentId,
                {
                    average: _avg.score ?? 0,
                    adjusted: calculateBayesianRating(_avg.score ?? priorAverage, _count.score, priorAverage),
                },
            ]),
        );
        const readsByContentId = new Map(readGroups.map(({ contentId, _count }) => [contentId, _count.userId]));
        const maxReads = Math.max(...readsByContentId.values(), 1);
        const totalGenreInterest = Math.max([...genreInterests.values()].reduce((total, weight) => total + weight, 0), 1);
        const totalTagInterest = Math.max([...tagInterests.values()].reduce((total, weight) => total + weight, 0), 1);
        const hasInterests = genreInterests.size > 0 || tagInterests.size > 0;
        const rankedCandidates = [];
        for (const content of candidates) {
            const matchingGenres = content.genres.filter(({ genreId }) => genreInterests.has(genreId)).length;
            const matchingTags = content.tags.filter(({ tagId }) => tagInterests.has(tagId)).length;
            const genreScore = content.genres.reduce((score, { genreId }) => score + (genreInterests.get(genreId) ?? 0), 0) / totalGenreInterest;
            const tagScore = content.tags.reduce((score, { tagId }) => score + (tagInterests.get(tagId) ?? 0), 0) / totalTagInterest;
            const rating = ratingsByContentId.get(content.id) ?? {
                average: 0,
                adjusted: priorAverage,
            };
            const recentReads = readsByContentId.get(content.id) ?? 0;
            const popularityScore = Math.log1p(recentReads) / Math.log1p(maxReads);
            const ageInDays = Math.max(0, (Date.now() - content.createdAt.getTime()) / (24 * 60 * 60 * 1000));
            const freshnessScore = Math.exp(-ageInDays / 60);
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
        rankedCandidates.sort((first, second) => second.recommendationScore - first.recommendationScore ||
            first.content.id.localeCompare(second.content.id));
        const diverseCandidates = diversifyTopRecommendations(rankedCandidates);
        const pageItems = diverseCandidates.slice((page - 1) * limit, page * limit);
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
                total: rankedCandidates.length,
                totalPages: Math.ceil(rankedCandidates.length / limit),
            },
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
