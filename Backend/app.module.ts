import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ContentModule } from './modules/content/content/content.module';
import { PublisherModule } from './modules/content/publisher/publisher.module';
import { AuthorModule } from './modules/content/author/author.module';
import { RatingModule } from './modules/reading/rating/rating.module';
import { BookmarkModule } from './modules/reading/bookmark/bookmark.module';
import { CommentModule } from './modules/community/comment/comment.module';
import { NotificationModule } from './modules/community/notification/notification.module';
import { ReportModule } from './modules/community/report/report.module';
import { AuthModule } from './modules/identity/auth/auth.module';
import { MangaModule } from './modules/content/manga/manga.module';
import { NovelModule } from './modules/content/novel/novel.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';
import { FavoriteModule } from './modules/reading/favorites/favourite.module';
import { ReadingProgressModule } from './modules/reading/reading-progress/reading-progress.module';
import { TicketModule } from './modules/community/ticket/ticket.module';
import { PaymentModule } from './modules/commerce/payment/payment.module';
import { WalletModule } from './modules/commerce/wallet/wallet.module';
import { UnlockModule } from './modules/reading/unlock/unlock.module';
import { RevenueModule } from './modules/commerce/revenue/revenue.module';
import { PayoutModule } from './modules/commerce/payout/payout.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ContentModule,
    PublisherModule,
    AuthorModule,
    RatingModule,
    BookmarkModule,
    CommentModule,
    NotificationModule,
    ReportModule,
    AuthModule,
    MangaModule,
    NovelModule,
    HealthModule,
    AdminModule,
    FavoriteModule,
    ReadingProgressModule,
    TicketModule,
    PaymentModule,
    WalletModule,
    UnlockModule,
    RevenueModule,
    PayoutModule,
    AiModule,
  ],
})
export class AppModule {}
