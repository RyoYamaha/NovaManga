import { IsOptional, IsString, MaxLength } from 'class-validator';

export class QueryAiUsersDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
