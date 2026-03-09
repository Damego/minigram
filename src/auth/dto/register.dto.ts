import { IsEmail, IsString, IsOptional, MinLength, IsDateString } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  display_name?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;
}