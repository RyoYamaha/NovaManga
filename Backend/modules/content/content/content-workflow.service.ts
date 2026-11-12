import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { ContentPricingType, ContentPurchaseMode, OwnershipTier, PublicationStatus } from '../../../common/constants/content.enum';
import { NotificationService } from '../../community/notification/notification.service';
import { NotificationType } from '../../../common/constants/notification.enum';
import { ContentValidationService } from './content-validation.service';
import { AiContentModerationService } from './ai-content-moderation.service';

@Injectable()
export class ContentWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly contentValidationService: ContentValidationService,
    private readonly aiContentModerationService: AiContentModerationService,
  ) {}

////////////////////////////////HÀM TẠO CONTENT//////////////////////////////////////////


  async createContent( contentData: CreateContentDto, uploaderId: string, ownershipTier: OwnershipTier, publisherId?: string, parentContentId?: string) {
    // Tham số	Ý nghĩa: 
    // contentData	Dữ liệu truyện gửi lên: tên, mô tả, ảnh bìa, thể loại, tag, giá...
    //uploaderId	ID người đang đăng truyện
    // ownershipTier	Phân loại quyền sở hữu nội dung
    // publisherId?	ID Publisher nếu có
    // parentContentId?	ID truyện gốc nếu đây là bản dịch cộng đồng

    // BƯỚC 1: Kiểm tra quy tắc theo loại truyện.
    // Fan Translation cần truyện gốc hợp lệ và phải miễn phí; Original không gắn truyện gốc;
    // chỉ Licensed (bản quyền) mới được bật dịch cộng đồng. Điều kiện cụ thể nằm trong ContentValidationService.
    this.contentValidationService.validateCreateContentInput( contentData, ownershipTier, parentContentId);

    // BƯỚC 2: Chuẩn bị giá, số coin, chương miễn phí và quyền dịch cộng đồng theo ownershipTier.
    // Fan Translation mặc định miễn phí, 0 coin và 0 chương đọc thử; truyện khác dùng giá trị mặc định
    // hoặc giá trị người tạo gửi lên. Hàm này cũng kiểm tra tính hợp lệ của cấu hình giá.
    const contentSettings = this.contentValidationService.prepareCreateContentSettings( contentData, ownershipTier );
    

    // BƯỚC 3: Chuẩn bị quan hệ nhiều-nhiều giữa truyện với Genre và Tag.
    // Prisma sẽ tạo các bản ghi quan hệ cùng lúc với Content ở cuối transaction.
    // Dùng create + connect để liên kết đến Genre/Tag đã có trong database.
    const genresData = this.buildCreateContentGenreRelations(contentData.genreIds);
    const tagsData = this.buildCreateContentTagRelations(contentData.tagIds);
    const aiModeration = await this.aiContentModerationService.reviewContentMetadata(
      contentData.type,
      contentData.title,
      contentData.synopsis,
    );


    //BƯỚC 4: TẠO TRUYỆN TỪ NHỮNG THÔNG TIN NG ƯỜI DÙNG GỬI LÊN
    const createdContent = await this.prisma.$transaction( async (transactionClient) => {


        // BƯỚC 4.1 Kiểm tra lại truyện gốc (Licensed, Published, miễn phí, cho phép dịch),
        // Publisher (đúng chủ sở hữu và đã Approved) và payout nếu nội dung trả phí.
        // Kiểm tra trong transaction để dữ liệu/quyền truy cập còn hợp lệ ngay tại thời điểm tạo.

        await this.contentValidationService.validateCreateContentTransactionRules( transactionClient, uploaderId, ownershipTier,
          publisherId,parentContentId, contentSettings.pricingType,);

        // Tạo Content ở trạng thái PendingApproval cùng Genre/Tag trong cùng transaction.
        return transactionClient.content.create({
          data: {
            title: contentData.title,
            synopsis: contentData.synopsis,
            aiModerationStatus: aiModeration.status,
            aiModerationReason: aiModeration.reason,
            aiModeratedAt: aiModeration.checkedAt,
            type: contentData.type,
            ownershipTier,
            publicationStatus: PublicationStatus.PendingApproval,
            coverImageUrl: contentData.coverImageUrl,
            pricingType: contentSettings.pricingType,
            purchaseMode: contentSettings.purchaseMode,
            priceCoins: contentSettings.priceCoins,
            freeChapters: contentSettings.freeChapters,
            allowCommunityTranslation: contentSettings.allowCommunityTranslation,
            uploaderId,
            publisherId,
            parentContentId,
            genres: genresData,
            tags: tagsData,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return this.prisma.content.findUniqueOrThrow({
      where: { id: createdContent.id },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
      },
    });
  }



  //chuẩn bị dữ liệu để liên kết Content với Genre và Tag đã tồn tại trong database.

  private buildCreateContentGenreRelations(genreIds?: string[]) {
    //vì mối quan hệ giữa 2 bảng content và tag / genre là nhiều nhiều
    //-> suy ra ta phải tạo bảng trung gian cho dễ truy vấn sau này, liên kết giữa 2 bảng tốt hơn

    if (!genreIds) {
      return undefined;
    }

    //genre: chỉ ra quan hệ genre bản ghi quan hệ đang tạo 
    //connect: yêu cầu prisma kết nối với một genre đã tồn tại 
    //name: xác định genre cần liên kết thông qua trường name 
    return { create: genreIds.map((genreName) => ({ genre: { connect: { name: genreName } },})),
    } satisfies Prisma.ContentCreateInput['genres'];
    //create: tạo bản ghi quan hệ Content Genre 
    //connect: liên kết bản ghi quan hệ với genre đã tồn tại 

    //tóm lại : hãy duyệt từng genrename trong genreid, kết nối nó với genrename thật có sẵn trong database 
  }


  private buildCreateContentTagRelations(tagIds?: string[]) {
    if (!tagIds) {
      return undefined;
    }

    return {
      create: tagIds.map((tagName) => ({
        tag: { connect: { name: tagName } },
      })),
    } satisfies Prisma.ContentCreateInput['tags'];
  }


  // Chỉnh sửa truyện (Title, Synopsis, Cover, Status, Genres, Tags)
  async updateContent(contentId: string, uploaderId: string, updateData: UpdateContentDto) {
    //contentId	ID của truyện cần cập nhật
    //uploaderId	ID người đăng truyện
    //updateData	Những thông tin người dùng muốn thay đổi


    const content = await this.prisma.content.findUnique({ where: { id: contentId } });
    if (!content) { throw new NotFoundException('Không tìm thấy Content');}

    // BƯỚC 2: KIỂM TRA GIÁ TRỊ MỚI TRƯỚC KHI LƯU 

    // 2.1 NẾU TRUYỆN LÀ FAN TRANSLATION THÌ PHẢI FREE, KHÔNG PHẢI THÌ UPDATE LOẠI TRẢ PHÍ

    let nextPricingType = content.pricingType;
    if (content.ownershipTier === OwnershipTier.FanTranslation) {
      nextPricingType = ContentPricingType.Free;
    
    } else if (updateData.pricingType !== undefined) {
      nextPricingType = updateData.pricingType;
    }

    // 2.2 NẾU TRUYỆN LÀ FANTRASLATION HOẶC LÀ LOẠI FREE THÌ ĐỂ GIÁ TIỀN =0 , CÒN KHÔNG THÌ TRẢ PHÍ 
    let nextPriceCoins = content.priceCoins;
    if (content.ownershipTier === OwnershipTier.FanTranslation) {
      nextPriceCoins = 0;
    } else if (nextPricingType === ContentPricingType.Free) {
      nextPriceCoins = 0;
    } else if (updateData.priceCoins !== undefined) {
      nextPriceCoins = updateData.priceCoins;
    }

    // 2.3 NẾU TRUYỆN LÀ TRANSLATION THÌ KHÔNG SET CHAP ĐỌC FREE, CÒN KHÔNG THÌ PHẢI THÌ 
    let nextFreeChapters = content.freeChapters;
    if (content.ownershipTier === OwnershipTier.FanTranslation) {
      nextFreeChapters = 0;
    } else if (updateData.freeChapters !== undefined) {
      nextFreeChapters = updateData.freeChapters;
    }

    let nextPurchaseMode = content.purchaseMode;
    if (
      content.ownershipTier === OwnershipTier.FanTranslation ||
      nextPricingType === ContentPricingType.Free
    ) {
      nextPurchaseMode = ContentPurchaseMode.Whole;
    } else if (updateData.purchaseMode !== undefined) {
      nextPurchaseMode = updateData.purchaseMode;
    }

    // BƯỚC 3 Kiểm tra quyền và các quy tắc giá, dịch cộng đồng trước khi cập nhật Content.
    await this.contentValidationService.validateUpdateContent(
      content,
      uploaderId,
      updateData,
      nextPricingType,
      nextPriceCoins,
      nextFreeChapters,
      nextPurchaseMode,
    );
    const metadataChanged = updateData.title !== undefined || updateData.synopsis !== undefined;
    const aiModeration = metadataChanged
      ? await this.aiContentModerationService.reviewContentMetadata(
          content.type,
          updateData.title ?? content.title,
          updateData.synopsis ?? content.synopsis,
        )
      : null;

    // BƯỚC 4 Cập nhật Content cùng các quan hệ Genre/Tag trong một transaction để tránh lưu dở dang.
    await this.prisma.$transaction(async (transactionClient) => {

      //4.1 KIỂM TRA HỒ SƠ NHẬN TIỀN TRƯỚC KHI CHUYỂN SANG PAID
      if ( content.pricingType !== ContentPricingType.Paid && nextPricingType === ContentPricingType.Paid) {
        //nếu truyện hiện tại không phải pay mà người dùng muốn update là pay 

        await this.contentValidationService.validateContentPayoutProfile(transactionClient, uploaderId);
      }

      //4.2 CẬP NHẬT GENRE VÀ TAGS

      if (updateData.genreIds) {
        //XÓA HẾT GENRE CŨ ĐI 
        await transactionClient.contentGenre.deleteMany({ where: { contentId } });
        if (updateData.genreIds.length > 0) {
          const genreRecords = await transactionClient.genre.findMany({
            where: { name: { in: updateData.genreIds } },
            select: { id: true },
          });
          //TẠO CONTENT VỚI GENRE MỚI 
          await transactionClient.contentGenre.createMany({
            data: genreRecords.map((genreRecord) => ({ contentId, genreId: genreRecord.id })),
          });
        }
      }
      
      //4.3 CẬP NHẬT TAGS
      if (updateData.tagIds) {
        await transactionClient.contentTag.deleteMany({ where: { contentId } });
        if (updateData.tagIds.length > 0) {
          const tagRecords = await transactionClient.tag.findMany({
            where: { name: { in: updateData.tagIds } },
            select: { id: true },
          });
          await transactionClient.contentTag.createMany({
            data: tagRecords.map((tagRecord) => ({ contentId, tagId: tagRecord.id })),
          });
        }
      }

      //BƯỚC 5: CHUẨN BỊ DỮ LIỆU TRƯỚC KHI CẬP NHẬT CONTENT 
      const contentUpdateData: Prisma.ContentUpdateInput = { publicationStatus: PublicationStatus.PendingApproval,reviewFeedback: null,};
      if (aiModeration) {
        contentUpdateData.aiModerationStatus = aiModeration.status;
        contentUpdateData.aiModerationReason = aiModeration.reason;
        contentUpdateData.aiModeratedAt = aiModeration.checkedAt;
      }

      if (updateData.title !== undefined) {
        contentUpdateData.title = updateData.title;
      }

      if (updateData.synopsis !== undefined) {
        contentUpdateData.synopsis = updateData.synopsis;
      }

      if (updateData.coverImageUrl !== undefined) {
        contentUpdateData.coverImageUrl = updateData.coverImageUrl;
      }

      if (updateData.storyStatus !== undefined) {
        contentUpdateData.storyStatus = updateData.storyStatus;
      }

      contentUpdateData.pricingType = nextPricingType;
      contentUpdateData.purchaseMode = nextPurchaseMode;
      contentUpdateData.priceCoins = nextPriceCoins;
      contentUpdateData.freeChapters = nextFreeChapters;


      if (content.ownershipTier === OwnershipTier.FanTranslation) {
        contentUpdateData.allowCommunityTranslation = false;
      } else if (nextPricingType === ContentPricingType.Paid) {
        contentUpdateData.allowCommunityTranslation = false;
        if (content.pricingType !== ContentPricingType.Paid) {
          contentUpdateData.pricingChangedAt = new Date();
        }
      } else {
        if (content.pricingType === ContentPricingType.Paid) {
          contentUpdateData.pricingChangedAt = null;
        }
        if (updateData.allowCommunityTranslation !== undefined) {
          contentUpdateData.allowCommunityTranslation = updateData.allowCommunityTranslation;
        }
      }

      await transactionClient.content.update({
        where: { id: contentId },
        data: contentUpdateData,
      });
    });

    return this.prisma.content.findUniqueOrThrow({
      where: { id: contentId },
      include: {
        genres: { include: { genre: true } },
        tags: { include: { tag: true } },
        uploader: { select: { id: true, username: true } },
      },
    });
  }

  async deleteOwnedContent(contentId: string, uploaderId: string) {
    return this.prisma.$transaction(async (transactionClient) => {
      const content = await transactionClient.content.findUnique({ where: { id: contentId } });
      if (!content) throw new NotFoundException('Không tìm thấy truyện');
      if (content.uploaderId !== uploaderId) {
        throw new ForbiddenException('Bạn không có quyền xóa truyện này');
      }

      const fanTranslationCount = await transactionClient.content.count({
        where: { parentContentId: contentId },
      });
      const purchaseCount = await transactionClient.contentPurchase.count({
        where: { contentId },
      });
      const chapterPackPurchaseCount =
        await transactionClient.chapterPackPurchase.count({
          where: { contentId },
        });
      const revenueCount = await transactionClient.creatorRevenue.count({
        where: { contentId },
      });
      if (fanTranslationCount > 0) {
        throw new ConflictException('Không thể xóa truyện đang có bản dịch cộng đồng liên kết');
      }
      if (purchaseCount > 0 || chapterPackPurchaseCount > 0 || revenueCount > 0) {
        throw new ConflictException('Không thể xóa truyện đã có giao dịch mua để bảo toàn lịch sử thanh toán');
      }

      const chapters = await transactionClient.chapter.findMany({
        where: { contentId },
        select: { id: true },
      });
      const chapterIds = chapters.map((chapter) => chapter.id);

      await transactionClient.readingProgress.deleteMany({ where: { contentId } });
      if (chapterIds.length > 0) {
        await transactionClient.chapterRead.deleteMany({ where: { chapterId: { in: chapterIds } } });
      }
      await transactionClient.chapterPage.deleteMany({ where: { chapter: { contentId } } });
      await transactionClient.chapterContent.deleteMany({ where: { chapter: { contentId } } });
      await transactionClient.chapter.deleteMany({ where: { contentId } });

      await transactionClient.bookmark.deleteMany({ where: { contentId } });
      await transactionClient.favorite.deleteMany({ where: { contentId } });
      await transactionClient.rating.deleteMany({ where: { contentId } });
      await transactionClient.comment.deleteMany({ where: { contentId } });
      await transactionClient.contentGenre.deleteMany({ where: { contentId } });
      await transactionClient.contentTag.deleteMany({ where: { contentId } });
      await transactionClient.mangaDetail.deleteMany({ where: { contentId } });
      await transactionClient.novelDetail.deleteMany({ where: { contentId } });
      await transactionClient.contentKnowledgeBase.deleteMany({ where: { contentId } });
      await transactionClient.aIConversation.deleteMany({ where: { contentId } });
      await transactionClient.aiChatSession.updateMany({
        where: { novelId: contentId },
        data: { novelId: null },
      });
      await transactionClient.recommendationCache.deleteMany({ where: { contentId } });

      return transactionClient.content.delete({ where: { id: contentId } });
    });
  }


  /** Chỉ Admin gọi — duyệt Content từ PendingApproval -> Published */
  async approve(contentId: string) {
    const content = await this.updateStatusGuarded( contentId, PublicationStatus.PendingApproval,PublicationStatus.Published,);
    await this.createNotificationSafely( content.uploaderId, NotificationType.ContentApproved,
    `Truyện "${content.title}" đã được duyệt và xuất bản.`,);
    return content;
  }


  /** Chỉ Admin gọi */
  async reject(contentId: string, rejectionReason?: string) {
    // Kiểm tra và chuẩn hóa lý do từ chối trước khi chuyển trạng thái.
    const normalizedRejectionReason = this.contentValidationService.validateRejectContentReason(rejectionReason);

    const content = await this.updateStatusGuarded( contentId, PublicationStatus.PendingApproval, PublicationStatus.Rejected,
      normalizedRejectionReason,);

    const message = `Truyện "${content.title}" đã bị từ chối. Lý do: ${normalizedRejectionReason}`;
    await this.createNotificationSafely(content.uploaderId, NotificationType.ContentRejected, message);
    return content;
  }


  async hide(contentId: string) {
    const content = await this.updateStatusGuarded( contentId, PublicationStatus.Published, PublicationStatus.Hidden,);
    await this.createNotificationSafely( content.uploaderId, NotificationType.ContentHidden, `Truyện "${content.title}" đã bị ẩn.`,);
    return content;
  }


  async restore(contentId: string) {
    const content = await this.updateStatusGuarded( contentId, PublicationStatus.Hidden, PublicationStatus.Published,);
    await this.createNotificationSafely( content.uploaderId, NotificationType.ContentRestored, `Truyện "${content.title}" đã được khôi phục.`,);
    return content;
  }


  /** Author/Publisher resubmit sau khi bị Reject */
  async resubmit(contentId: string, uploaderId: string) {
    const content = await this.prisma.content.findUnique({ where: { id: contentId } });
    if (!content) {
      throw new NotFoundException('Không tìm thấy Content');
    }

    // Chỉ người tạo nội dung được gửi lại truyện đang bị từ chối.
    this.contentValidationService.validateResubmitContent(content, uploaderId);

    return this.prisma.content.update({ where: { id: contentId }, data: { publicationStatus: PublicationStatus.PendingApproval, reviewFeedback: null },});
  }


  private async updateStatusGuarded( contentId: string, expectedPublicationStatus: PublicationStatus, nextPublicationStatus: PublicationStatus,
    rejectionReason?: string,) {
    const content = await this.prisma.content.findUnique({ where: { id: contentId } });
    if (!content) {
      throw new NotFoundException('Không tìm thấy Content');
    }

    // Kiểm tra trạng thái hiện tại trước khi chuyển sang trạng thái tiếp theo.
    this.contentValidationService.validateContentStatusTransition(
      content.publicationStatus,
      expectedPublicationStatus,
      nextPublicationStatus,
    );

    const contentStatusUpdateData: {
      publicationStatus: PublicationStatus;
      reviewFeedback?: string;
    } = {
      publicationStatus: nextPublicationStatus,
    };

    if (rejectionReason !== undefined) {
      contentStatusUpdateData.reviewFeedback = rejectionReason;
    }

    return this.prisma.content.update({
      where: { id: contentId },
      data: contentStatusUpdateData,
    });
  }

  private async createNotificationSafely(userId: string,notificationType: NotificationType, message: string,) {
    try {
      await this.notificationService.create(userId, notificationType, message);
    } catch (error) {
      console.error('Failed to create notification', error);
    }
  }
}
