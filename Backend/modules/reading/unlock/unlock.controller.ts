import { Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UnlockService } from './unlock.service';

@Controller('unlock')
@UseGuards(JwtAuthGuard)
export class UnlockController {
  constructor(private readonly unlockService: UnlockService) {}

  @Post('content/:contentId/purchase')
  purchaseContent(
    @Param('contentId') contentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.unlockService.purchaseContent(userId, contentId);
  }

  @Post('content/:contentId/chapters/:chapterNumber/purchase-pack')
  purchaseChapterPack(
    @Param('contentId') contentId: string,
    @Param('chapterNumber', ParseIntPipe) chapterNumber: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.unlockService.purchaseChapterPack(
      userId,
      contentId,
      chapterNumber,
    );
  }

  @Get('content/:contentId')
  getContentAccess(
    @Param('contentId') contentId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.unlockService.getContentAccess(userId, contentId);
  }
}
