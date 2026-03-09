import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ContactStatus } from '../entities/contact.entity';

export class UpdateContactDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;
}