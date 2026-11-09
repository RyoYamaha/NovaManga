import { Module } from '@nestjs/common';
import { AiAdminController } from './ai-admin.controller';
import { AiChatService } from './ai-chat.service';
import { AiController } from './ai.controller';
import { AiNovelToolsService } from './ai-novel-tools.service';
import { AiProviderService } from './ai-provider.service';
import { AiSettingsService } from './ai-settings.service';

@Module({
  controllers: [AiController, AiAdminController],
  providers: [
    AiChatService,
    AiNovelToolsService,
    AiProviderService,
    AiSettingsService,
  ],
})
export class AiModule {}
