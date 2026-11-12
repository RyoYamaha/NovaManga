import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryContentDto } from './dto/query-content.dto';
import { QueryCatalogSortDto } from './dto/query-catalog-sort.dto';
import { PublicationStatus } from '../../../common/constants/content.enum';
import {
  communityTranslationVisibilityWhere,
  isCommunityTranslationVisible,
} from './content-visibility';
import { ContentDiscoveryService } from './content-discovery.service';

@Injectable()
export class ContentCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contentDiscoveryService: ContentDiscoveryService,
  ) {}



  // Trả danh sách truyện đã xuất bản theo bộ lọc và phân trang.
  async findAll(contentQuery: QueryContentDto) {
    //BƯỚC 1: SAU KHI ĐƯỢC TRUYỀN DỮ LIỆU VÀO -> XÁC ĐỊNH BẢN GHI VÀ SỐ BẢN GHI
    const pageNumber = contentQuery.page;
    const pageSize = contentQuery.limit;

    //BƯỚC 2: TẠO BIẾN CONTENTFILTER ĐỂ TẠO ĐIỀU KIỆN LỌC KHÁC NHAU ĐỂ SỬ DỤNG WHERE KHI TRUY VẤN TỐT HƠN
    const contentFilter: Prisma.ContentWhereInput = {publicationStatus: contentQuery.publicationStatus || PublicationStatus.Published};
      //tạo bộ lọc content, mặc địch là published còn không thì là lấy theo tham số 

    contentFilter.AND = [communityTranslationVisibilityWhere()]; //thêm 1 bộ lọc 
    //Nếu là bản dịch cộng đồng, truyện gốc trả phí và đã quá thời gian chuyển tiếp, bản dịch sẽ không vượt qua bộ lọc này.


    //lọc theo loại nội dung
    if (contentQuery.type) {
      contentFilter.type = contentQuery.type;
    }
    //lọc theo ownership tier
    if (contentQuery.ownershipTier) {
      contentFilter.ownershipTier = contentQuery.ownershipTier;
    }
    // tương tự
    if (contentQuery.search) {
      contentFilter.title = { contains: contentQuery.search };
    }

    if (contentQuery.genreId) {
      contentFilter.genres = { some: { genreId: contentQuery.genreId } };
    }

    if (contentQuery.tagId) {
      contentFilter.tags = { some: { tagId: contentQuery.tagId } };
    }

    //BƯỚC 3 TÌM DATA THEO BỘ LỌC + ĐẾM SỐ CONTENT

    const [contentItems, totalContentCount] = await Promise.all([
      //countentItemt nhận kết quả từ truy vấn findmany
      //totalcontentcount nhận kết quả sau khi đếm toàn bộ lượng content
      this.prisma.content.findMany({ where: contentFilter,
        skip: (pageNumber - 1) * pageSize,
        //kiểu đây lấy theo trang
        //vd: người dùng sang trang 2, pagesize chỉ được hiển thị 10
        //-> (2-1) *10 = 10 -> skip 10 bản ghi và bắt đầu từ bản ghi số 11
        take: pageSize, //quy định số bản ghi tối đa muốn lấy từ database
        orderBy: { createdAt: 'desc' },
        include: {
          genres: { include: { genre: true } },
          tags: { include: { tag: true } },
          uploader: { select: { id: true, username: true } },
        },
      }),

      this.prisma.content.count({ where: contentFilter }),
    ]);

    //BƯỚC 4: TRẢ DATA VỀ CHO FRONTEND HIỂN THỊ

    return {
      items: contentItems,
      meta: {
        page: pageNumber,
        limit: pageSize,
        total: totalContentCount,
        totalPages: Math.ceil(totalContentCount / pageSize),
      },
    };
  }



  async findOne(contentId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        chapters: { orderBy: { number: 'asc' }},
        uploader: { select: { id: true, username: true } },
        publisher: true,
        parentContent: {
          select: {
            id: true,
            title: true,
            pricingType: true,
            pricingChangedAt: true,
          },
        },
      },
    });

    if (!content) throw new NotFoundException('Không tìm thấy Content');
    if (!isCommunityTranslationVisible(content)) {
      throw new NotFoundException('Content không tồn tại hoặc không được hiển thị');
    }
    return content;
  }



  // Dữ liệu danh mục
  async getGenres() {
    return this.prisma.genre.findMany({ orderBy: { name: 'asc' } });
  }



  async getTags(sortOrder: QueryCatalogSortDto['sort'] = 'name') {
    //BƯỚC 1: LẤY DANH SÁCH TAG
    const tags = await this.prisma.tag.findMany({ orderBy: { name: 'asc' } });


    if (sortOrder !== 'popular') return tags;

    //BƯỚC 2: LẤY DANH SÁCH TAGS POPULAR


    //BƯỚC 2.1: LẤY THÔNG KÊ ĐỘC GIẢ GẦN ĐÂY, NHỮNG CONTENT NÀO CÓ NHIỀU NGƯỜI ĐỌC NHẤT 
    const recentContentReadCounts =
      await this.contentDiscoveryService.getRecentContentReadCounts();

    //BƯỚC 2.2: DUYỆT QUA TỪNG PHẦN TỬ MẢNG VÀ LẤY RA CONTENTID ĐỂ DÙNG NÓ LẤY RA TAGS CỦA MỖI CONTENT
    const contentIds = recentContentReadCounts.map((contentReadCount) => contentReadCount.contentId);


      let contentTagAssociations = [];

      if (contentIds.length > 0) { 
          contentTagAssociations = await this.prisma.contentTag.findMany({ where: { contentId: {in: contentIds,},},
            select: { contentId: true, tagId: true,},});
      }

    
    
    
    //BƯỚC 2.4; DUYỆT QUA TỪNG PHẦN TỬ CỦA BIẾN NGƯỜI ĐỌC GẦN ĐÂY GÁN NÓ THÀNH KEY VALUE 
    //KEY LÀ CONTENTID, VALUE LÀ ACTIVEREADERCOUNT (SỐ LƯỢNG NGƯỜI ĐỌC)
    const activeReadersByContentId = new Map(
      recentContentReadCounts.map((contentReadCount) => [contentReadCount.contentId, contentReadCount.activeReaderCount,]),
    );

    //BƯỚC 2.5 SET KEY VALUE, MỖI TAGSID CÓ BAO NHIỀU NGƯỜI ĐANG ĐỌC 
    const activeReadsByTagId = new Map<string, number>();

    for (const contentTagAssociation of contentTagAssociations) { 
      //duyệt qua từng phần tử, contenttagassociation sẽ chứa phần tử đang được duyệt đấy 
      const activeReaders = activeReadersByContentId.get(contentTagAssociation.contentId) ?? 0; // Lấy số độc giả của Content hiện tại dựa vào contentId
      const currentActiveReads = activeReadsByTagId.get(contentTagAssociation.tagId) ?? 0;  // Lấy điểm đã tích lũy trước đó của Tag hiện tại
      activeReadsByTagId.set(contentTagAssociation.tagId, currentActiveReads + activeReaders);  // Cộng số độc giả của Content hiện tại vào tổng điểm của Tag tương ứng


      // Ví dụ: Truyện A có 50 độc giả, Truyện B có 30 độc giả.
      // Cả hai đều gắn Tag Action nên điểm của Action bằng 80.
      // Lần 1: 0 + 50 = 50 (Truyện A)
      // Lần 2: 50 + 30 = 80 (Truyện B)
      // Vòng for chạy theo số lượng phần tử trong contentTagAssociations.
    }


    // Đoạn code này có nhiệm vụ thêm điểm phổ biến cho từng Tag, sau đó sắp xếp Tag từ phổ biến nhất đến ít phổ biến nhất.
    return tags
      .map((tag) => ({ ...tag, activeReads: activeReadsByTagId.get(tag.id) ?? 0 }))
      .sort((firstTag, secondTag) => secondTag.activeReads - firstTag.activeReads || firstTag.name.localeCompare(secondTag.name),);
      //.map() — Thêm activeReads vào mỗi Tag.
      //.sort() — Sắp xếp Tag theo độ phổ bi++ến giảm dần.
      //|| firstTag.name.localeCompare(secondTag.name) — Nếu bằng điểm thì sắp xếp theo tên A → Z.
  }



  async getPublishers(sortOrder: QueryCatalogSortDto['sort'] = 'name') {

    //BƯỚC 1: TÌM PUBLISHER CÓ ÍT NHẤT 1 TRUYỆN ĐÃ XUẤT BẢN 

    const publisherRecords = await this.prisma.publisher.findMany({
      where: { contents: { some: { publicationStatus: PublicationStatus.Published } } },
      //some: phải có ít nhất 1 
      select: {
        id: true,
        organizationName: true,
        contents: {
          where: { publicationStatus: PublicationStatus.Published },
          select: { id: true },
        },
      },
      orderBy: { organizationName: 'asc' },
    });
    
    //BƯỚC 2: LẤY DANH SÁCH THEO TÊN , ĐỒNG THỜI ĐẾM SỐ CONTENT ĐƯỢC TRẢ LẠI 

    if (sortOrder !== 'popular') {
      //map duyệt từng phẩn tử trong mảng publisherrecored
      //chia 1 object ra biến content: chứa publihserContent, còn biến publihser sẽ chứa toàn bộ các thuộc tính còn lại của 1 object 
      //return được 2 biến chứa 2 mảng  + số content 
      return publisherRecords.map(({ contents: publishedContents, ...publisher }) => ({...publisher,
        publishedContentCount: publishedContents.length,
      }));
    }

    //BƯỚC 3: LẤY DANH SÁCH THEO ĐỘ NỔI TIẾNG 

    //BƯỚC 3.1 LẤY SỐ NGƯỜI ĐỌC CỦA MỖI CONTENT 
    const recentContentReadCounts =
      await this.contentDiscoveryService.getRecentContentReadCounts();

    //BƯỚC 3.2 DUYỆT QUA TỪNG PHẦN TỬ CỦA BIẾN CHỨA MẢNG, RỒI GOM LẠI THÀNH BIẾN CHỨA CẶP GIÁ TRỊ KEYVALUE CHO DỄ TRA CỨU SAU NÀY
    const activeReadersByContentId = new Map( recentContentReadCounts.map((contentReadCount) => [ contentReadCount.contentId, contentReadCount.activeReaderCount,]),);
    

    return publisherRecords.map(({ contents: publishedContents, ...publisher }) => {
      let activeReads = 0;

      for (const publishedContent of publishedContents) {
        activeReads += activeReadersByContentId.get(publishedContent.id) ?? 0;
      }

      return {
        ...publisher, //tạo ra object publisher (không còn thuộc tính content)
        //với các thuộc tính bổ sung 
        activeReads,
        publishedContentCount: publishedContents.length,
      };
    })

    //sort() duyệt và so sánh từng cặp phần tử để sắp xếp mảng.
      //Quy tắc của sort(): số lớn hơn thì đứng trước 
      //- Kết quả âm: firstPublisher đứng trước -> tức là first lớn hơn second .
      //- Kết quả dương: secondPublisher đứng trước -> tức là second lớn hơn first.

      .sort((firstPublisher, secondPublisher) =>
        secondPublisher.activeReads - firstPublisher.activeReads
        || firstPublisher.organizationName.localeCompare(secondPublisher.organizationName),
        //nếu 2 số bằng nhau thì so sánh bằng tên của first và second
        //vd first: abc so sánh với second def , vì abc đứng trước def thì trả về âm, tức là second đứng trước 
        
      );
  }
}
