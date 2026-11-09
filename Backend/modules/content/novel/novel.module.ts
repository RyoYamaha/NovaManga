import { Module } from '@nestjs/common';
import { NovelService } from './novel.service';
import { NovelController } from './novel.controller';
import { ChapterModule } from '../chapter/chapter.module';
import { ContentModule } from '../content/content.module';
import { CloudinaryModule } from '../../../common/cloudinary/cloudinary.module';
import { UnlockModule } from '../../reading/unlock/unlock.module';

@Module({
  imports: [ChapterModule, ContentModule, CloudinaryModule, UnlockModule],
  controllers: [NovelController],
  providers: [NovelService],
})
export class NovelModule {}