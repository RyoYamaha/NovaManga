import { IsString, IsUUID } from 'class-validator';
import { CreateContentDto } from '../../content/dto/create-content.dto';

export class CreateFanTranslationDto extends CreateContentDto {
  @IsString()
  @IsUUID()
  parentContentId: string; // bắt buộc — Content gốc (Licensed) mà Author chọn để dịch
}