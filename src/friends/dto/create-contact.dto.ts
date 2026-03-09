import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ContactStatus } from '../entities/contact.entity';

export class CreateContactDto {
  @IsUUID()
  friendId: string;

  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;
}