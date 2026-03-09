import { IsString, IsOptional } from 'class-validator';

export class SearchUsersDto {
  @IsOptional()
  @IsString()
  q?: string;
}