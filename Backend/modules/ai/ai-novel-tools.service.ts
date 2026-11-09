import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MAX_AI_SEARCH_RESULTS } from './ai.constants';
import { communityTranslationVisibilityWhere } from '../content/content/content-visibility';

type NovelSort = 'rating' | 'newest' | 'chapters';

interface NovelSearchFilters {
  genre?: string;
  tag?: string;
  storyStatus?: 'Ongoing' | 'Completed' | 'Hiatus';
  sortBy?: NovelSort;
}

@Injectable()
export class AiNovelToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNovelInfo(novelId: string) {
    const novel = await this.prisma.content.findFirst({
      where: { ...this.publicNovelWhere(), id: novelId },
      select: {
        id: true,
        title: true,
        synopsis: true,
        ownershipTier: true,
        storyStatus: true,
        pricingType: true,
        priceCoins: true,
        freeChapters: true,
        uploader: { select: { username: true } },
        publisher: { select: { organizationName: true } },
        genres: { select: { genre: { select: { name: true } } } },
        tags: { select: { tag: { select: { name: true } } } },
      },
    });

    if (!novel) return { found: false };

    //THỐNG KÊ DỮ LIỆU 
    const [chapterCount, rating, views] = await Promise.all([
      //bao nhiêu chương
      this.prisma.chapter.count({
        where: { contentId: novel.id, moderationStatus: 'Published' },
      }),
      //điểm trung bình 
      this.prisma.rating.aggregate({
        where: { contentId: novel.id },
        _avg: { score: true },
        _count: { score: true },
      }),
      //đếm lượt đọc 
      this.prisma.chapterRead.count({
        where: { chapter: { contentId: novel.id, moderationStatus: 'Published' } },
      }),
    ]);

    return {
      found: true,
      id: novel.id,
      title: novel.title,
      synopsis: novel.synopsis,
      storyStatus: novel.storyStatus,
      ownershipTier: novel.ownershipTier,
      officialEdition: novel.ownershipTier === 'Licensed',
      genres: novel.genres.map(({ genre }) => genre.name),
      tags: novel.tags.map(({ tag }) => tag.name),
      chapterCount,
      freeChapters: novel.freeChapters,
      pricingType: novel.pricingType,
      purchaseCostCoins: novel.pricingType === 'paid' ? novel.priceCoins : 0,
      uploader: novel.uploader.username,
      publisher: novel.publisher?.organizationName ?? null,
      ratingAverage: rating._avg.score,
      ratingCount: rating._count.score,
      completedChapterReads: views,
    };
  }

  // BƯỚC 1: NHẬN CÁC BỘ LỌC SEARCHNOVELS TỪ AI PROVIDER
  async searchNovels(filters: NovelSearchFilters) {
    // BƯỚC 2: KHỞI TẠO ĐIỀU KIỆN CHỈ LẤY NOVEL CÔNG KHAI, ĐÃ XUẤT BẢN
    // BƯỚC 3: BỔ SUNG BỘ LỌC THỂ LOẠI, TAG VÀ TRẠNG THÁI NẾU ĐƯỢC CUNG CẤP
    const where = {
      ...this.publicNovelWhere(),
      ...(filters.genre
        ? { genres: { some: { genre: { name: { contains: filters.genre } } } } }
        : {}),
      ...(filters.tag
        ? { tags: { some: { tag: { name: { contains: filters.tag } } } } }
        : {}),
      ...(filters.storyStatus ? { storyStatus: filters.storyStatus } : {}),
    };

    // BƯỚC 4: LẤY TỐI ĐA 500 NOVEL ỨNG VIÊN VÀ CÁC THÔNG TIN CẦN THIẾT
    const candidates = await this.prisma.content.findMany({
      where,
      select: {
        id: true,
        title: true,
        synopsis: true,
        ownershipTier: true,
        storyStatus: true,
        pricingType: true,
        priceCoins: true,
        freeChapters: true,
        createdAt: true,
        uploader: { select: { username: true } },
        publisher: { select: { organizationName: true } },
        genres: { select: { genre: { select: { name: true } } } },
        tags: { select: { tag: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // BƯỚC 5: LẤY ĐIỂM ĐÁNH GIÁ, SỐ CHAPTER ĐÃ XUẤT BẢN VÀ GHÉP VÀO KẾT QUẢ
    const contentIds = candidates.map(({ id }) => id);
    const [ratings, chapterCounts] = contentIds.length
      ? await Promise.all([
          this.prisma.rating.groupBy({
            by: ['contentId'],
            where: { contentId: { in: contentIds } },
            _avg: { score: true },
            _count: { score: true },
          }),
          this.prisma.chapter.groupBy({
            by: ['contentId'],
            where: {
              contentId: { in: contentIds },
              moderationStatus: 'Published',
            },
            _count: { id: true },
          }),
        ])
      : [[], []];
    
    //tạo bảng tra cứu điểm đánh giá theo id truyện (lấy từ ratings trên)
    //ratings trên trả 1 bảng truyện, mỗi truyện điểm trung bình như nào
    //sau đó map lại thành dạng key value, để tra cứu sau này 

    const ratingByContentId = new Map(
      ratings.map((rating) => [
        rating.contentId,
        { average: rating._avg.score, count: rating._count.score },
      ]),
    );
    //tương tự 
    const chaptersByContentId = new Map(
      chapterCounts.map(({ contentId, _count }) => [contentId, _count.id]),
    );

    //ghép dữ liệu truyện và danh sách thống kê đã tra để 
    // tạo ra danh sách item nhất quán, sau đó được sắp xếp
    //và giới hạn kết quả như ở dưới 
    const items = candidates.map((novel) => ({
      id: novel.id,
      title: novel.title,
      synopsis: novel.synopsis,
      ownershipTier: novel.ownershipTier,
      officialEdition: novel.ownershipTier === 'Licensed',
      storyStatus: novel.storyStatus,
      genres: novel.genres.map(({ genre }) => genre.name),
      tags: novel.tags.map(({ tag }) => tag.name),
      chapterCount: chaptersByContentId.get(novel.id) ?? 0,
      freeChapters: novel.freeChapters,
      pricingType: novel.pricingType,
      purchaseCostCoins: novel.pricingType === 'paid' ? novel.priceCoins : 0,
      uploader: novel.uploader.username,
      publisher: novel.publisher?.organizationName ?? null,
      ratingAverage: ratingByContentId.get(novel.id)?.average ?? null,
      ratingCount: ratingByContentId.get(novel.id)?.count ?? 0,
      createdAt: novel.createdAt,
    }));

    // BƯỚC 6: SẮP XẾP KẾT QUẢ THEO TIÊU CHÍ ĐƯỢC YÊU CẦU
    if (filters.sortBy === 'rating') { //nếu lọc bằng rating
      items.sort(
        //điểm trung bình cao xếp trước 
        //nếu bằng điieemr thì truyện có nhiều lượt đánh giá hơn xếp trước
        //nếu second trừ đi first ra số âm thì first đứng trước,
        //  không thì second sẽ đứng trước
        (first, second) =>
          (second.ratingAverage ?? 0) - (first.ratingAverage ?? 0) ||
          second.ratingCount - first.ratingCount,
      );
    } else if (filters.sortBy === 'chapters') { //tương tự 
      items.sort((first, second) => second.chapterCount - first.chapterCount);
    } else if (filters.sortBy !== 'newest') {  //
      items.sort( //truyện bản quyền được ưu tiên hơn 
        (first, second) =>
          Number(second.officialEdition) - Number(first.officialEdition) ||
        //chuyển giá trị truyện bản quyền true false sang dạng 1 và 0 
        //từ đó ưu tiên truyện bản quyền trước , còn nếu chúng đều là truyện bản quyền thì
        // so sánh theo điểm trung bình 
          (second.ratingAverage ?? 0) - (first.ratingAverage ?? 0),
      );
    }

    // BƯỚC 7: CHỈ TRẢ VỀ SỐ LƯỢNG KẾT QUẢ TỐI ĐA ĐƯỢC CẤU HÌNH
    return { items: items.slice(0, MAX_AI_SEARCH_RESULTS) };
  }

  async getSimilarNovels(novelId: string) {
    //BƯỚC TÌM NOVEL GỐC NGƯỜI DÙNG CÓ TỒN TẠI KHÔNG
    const source = await this.prisma.content.findFirst({
      where: { ...this.publicNovelWhere(), id: novelId },
      select: {
        id: true,
        genres: { select: { genreId: true } },
        tags: { select: { tagId: true } },
      },
    });
    if (!source) return { found: false, items: [] };

    const genreIds = source.genres.map(({ genreId }) => genreId);
    const tagIds = source.tags.map(({ tagId }) => tagId);
    if (!genreIds.length && !tagIds.length) return { found: true, items: [] };

    const where = { //biến where lưu toàn bộ điều kiện
      ...this.publicNovelWhere(),
      id: { not: source.id },
      OR: [
        ...(genreIds.length ? [{ genres: { some: { genreId: { in: genreIds } } } }] : []),
        ...(tagIds.length ? [{ tags: { some: { tagId: { in: tagIds } } } }] : []),
      ],
    };
    //BƯỚC 2: TÌM NOVEL CÙNG THỂ LOẠI 
    const candidates = await this.prisma.content.findMany({
      where,
      select: {
        id: true,
        title: true,
        synopsis: true,
        ownershipTier: true,
        storyStatus: true,
        freeChapters: true,
        pricingType: true,
        priceCoins: true,
        genres: { select: { genre: { select: { name: true } } } },
        tags: { select: { tag: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    //BƯỚC 3 GROUP CÁC CONTENT THEO RATING VÀ MAP NÓ LẠI CHO TIỆN TRUY VẤN
    const ratings = candidates.length
    //ratings bằng candidates là số lượng ứng cử viên 
    //số lượng ứng cử viên là sau khi rating của mỗi content lại
    //  , điểm trung bình và count 
      ? await this.prisma.rating.groupBy({
          by: ['contentId'],
          where: { contentId: { in: candidates.map(({ id }) => id) } },
          _avg: { score: true },
          _count: { score: true },
        })
      : [];
      //map lại ratings thành ratingby id để với key là content id và 
      //value là average và count để tiện truy vấn sau này 
    const ratingById = new Map(
      ratings.map((rating) => [
        rating.contentId,
        { average: rating._avg.score, count: rating._count.score },
      ]),
    );

    //GÁN THÔNG TIN ĐẦY ĐỦ CHO ITEM BAO GỒM:
    //bổ sung lượng đọc  và điểm trung bình 
    const items = candidates.map((novel) => ({
      // candidates là truyện đã duyệt được từ database 
      // novel là tượng trưng cho từng novel được duyệt trong candicates
        id: novel.id,
        title: novel.title,
        synopsis: novel.synopsis,
        ownershipTier: novel.ownershipTier,
        officialEdition: novel.ownershipTier === 'Licensed',
        storyStatus: novel.storyStatus,
        genres: novel.genres.map(({ genre }) => genre.name),
        tags: novel.tags.map(({ tag }) => tag.name),
        freeChapters: novel.freeChapters,
        pricingType: novel.pricingType,
        purchaseCostCoins: novel.pricingType === 'paid' ? novel.priceCoins : 0,
        ratingAverage: ratingById.get(novel.id)?.average ?? null,
        ratingCount: ratingById.get(novel.id)?.count ?? 0,
      }));
    items.sort(
    //sắp xếp lại 
      (first, second) =>
        Number(second.officialEdition) - Number(first.officialEdition) ||
        (second.ratingAverage ?? 0) - (first.ratingAverage ?? 0) ||
        second.ratingCount - first.ratingCount,
    );
    //cuối cùng mới trả truyện similar cho người dùng 
    return { found: true, items: items.slice(0, MAX_AI_SEARCH_RESULTS) };
  }

  private publicNovelWhere() {
    return {
      type: 'Novel',
      publicationStatus: 'Published',
      AND: [communityTranslationVisibilityWhere()],
    };
  }
}
