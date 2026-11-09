import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ContentModule } from '../content/content/content.module';
import { PublisherModule } from '../content/publisher/publisher.module';
import { ChapterModule } from '../content/chapter/chapter.module';
import { NovelModule } from '../content/novel/novel.module';

@Module({
  imports: [ContentModule, PublisherModule, ChapterModule, NovelModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
