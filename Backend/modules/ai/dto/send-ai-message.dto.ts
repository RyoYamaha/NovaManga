import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { MAX_AI_MESSAGE_LENGTH } from '../ai.constants';

export class SendAiMessageDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsUUID()
  novelId?: string;

  @IsString()
  @Length(1, MAX_AI_MESSAGE_LENGTH)
  message!: string;
}
