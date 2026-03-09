import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('avatars')
export class Avatar {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  url: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.avatars, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}