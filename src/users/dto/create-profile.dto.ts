import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateProfileDto {
  @IsOptional()
  @IsString()
  display_name?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;
}