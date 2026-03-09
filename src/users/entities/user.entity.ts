import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Avatar } from './avatar.entity';
import { Contact } from '../../friends/entities/contact.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column()
  hashed_password: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ nullable: true })
  refresh_token: string | null;

  @Column({ nullable: true })
  refresh_token_expires_at: Date | null;

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn()
  profile: Profile;

  @OneToMany(() => Avatar, (avatar) => avatar.user)
  avatars: Avatar[];

  @OneToMany(() => Contact, (contact) => contact.user)
  contacts: Contact[];

  @OneToMany(() => Contact, (contact) => contact.friend)
  friendContacts: Contact[];
}