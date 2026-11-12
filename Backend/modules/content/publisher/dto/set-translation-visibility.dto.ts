import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class SetTranslationVisibilityDto {
  @IsBoolean()
  hidden!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
