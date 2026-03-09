import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { Avatar } from './entities/avatar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Avatar]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}