import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiChatService } from './ai-chat.service';
import { SendAiMessageDto } from './dto/send-ai-message.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Get('status')
  getStatus(@CurrentUser('id') userId: string) {
    return this.aiChatService.getStatus(userId);
  }

  @Post('chat')
  sendMessage(
    @CurrentUser('id') userId: string,
    @Body() dto: SendAiMessageDto,
  ) {
    return this.aiChatService.sendMessage(userId, dto);
  }

  @Get('sessions')
  listSessions(@CurrentUser('id') userId: string) {
    return this.aiChatService.listSessions(userId);
  }

  @Get('sessions/:sessionId')
  getSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.aiChatService.getSession(userId, sessionId);
  }

  @Delete('sessions/:sessionId')
  deleteSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.aiChatService.deleteSession(userId, sessionId);
  }
}
