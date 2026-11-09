import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AiSettingsService } from './ai-settings.service';
import { QueryAiUsersDto } from './dto/query-ai-users.dto';
import { UpdateAiSettingsDto } from './dto/update-ai-settings.dto';

@Controller('admin/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AiAdminController {
  constructor(private readonly settingsService: AiSettingsService) {}

  @Get('settings')
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser('id') actorId: string,
    @Body() dto: UpdateAiSettingsDto,
  ) {
    return this.settingsService.updateSettings(dto, actorId);
  }

  @Get('usage')
  getUsageStats() {
    return this.settingsService.getUsageStats();
  }

  @Get('users')
  listAiUsers(@Query() query: QueryAiUsersDto) {
    return this.settingsService.listAiUsers(query.search?.trim());
  }

  @Patch('users/:userId/block')
  blockUser(@Param('userId') userId: string, @CurrentUser('id') actorId: string) {
    return this.settingsService.setUserAiBlocked(userId, true, actorId);
  }

  @Patch('users/:userId/unblock')
  unblockUser(@Param('userId') userId: string, @CurrentUser('id') actorId: string) {
    return this.settingsService.setUserAiBlocked(userId, false, actorId);
  }
}
