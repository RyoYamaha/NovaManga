import { Module } from '@nestjs/common';
import { ContentService } from './content.service';
import { ContentCatalogService } from './content-catalog.service';
import { ContentDiscoveryService } from './content-discovery.service';
import { ContentWorkflowService } from './content-workflow.service';
import { ContentDefaultsSeedService } from './content-defaults-seed.service';
import { ContentValidationService } from './content-validation.service';
import { AiContentModerationService } from './ai-content-moderation.service';
import { ContentController, GenreController, TagController } from './content.controller';

@Module({
  controllers: [ContentController, GenreController, TagController],
  providers: [
    ContentDefaultsSeedService,
    ContentCatalogService,
    ContentDiscoveryService,
    ContentWorkflowService,
    ContentService,
    ContentValidationService,
    AiContentModerationService,
  ],
  exports: [ContentService, AiContentModerationService],
})
export class ContentModule {}