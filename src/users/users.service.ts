import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { Avatar } from './entities/avatar.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    @InjectRepository(Avatar)
    private avatarRepository: Repository<Avatar>,
  ) {}

  // Текущий ID пользователя (в реальном проекте — из JWT токена)
  private currentUserId: string = '1';

  // ✅ Установить currentUserId из JWT
  setCurrentUserId(userId: string) {
    this.currentUserId = userId;
  }

  // Поиск пользователя по email
  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email, is_deleted: false },
      relations: ['profile', 'avatars', 'contacts', 'friendContacts'],
    });
  }

  // Поиск пользователя по username
  async findByUsername(username: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { username, is_deleted: false },
      relations: ['profile', 'avatars', 'contacts', 'friendContacts'],
    });
  }

  // Создание пользователя
  async createUser(createUserDto: {
    email: string;
    username: string;
    hashed_password: string;
  }): Promise<User> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email уже занят');
    }

    const user = this.usersRepository.create({
      email: createUserDto.email,
      username: createUserDto.username,
      hashed_password: createUserDto.hashed_password,
      is_deleted: false,
    });

    return await this.usersRepository.save(user);
  }

  // Обновление refresh токена
  async updateRefreshToken(userId: string, refreshToken: string | null) {
    await this.usersRepository.update(userId, {
      refresh_token: refreshToken,
      refresh_token_expires_at: refreshToken
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 дней
        : null,
    });
  }

  // GET /api/v1/users/me
  async findMe() {
    const user = await this.usersRepository.findOne({
      where: { id: this.currentUserId },
      relations: ['profile', 'avatars', 'contacts', 'friendContacts'],
    });
    if (!user) throw new NotFoundException('Пользователь не найден');
    const { hashed_password, refresh_token, ...result } = user;
    return result;
  }

  // PUT /api/v1/users/me
  async updateMe(updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: { id: this.currentUserId },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (updateUserDto.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Email уже занят');
      }
    }

    await this.usersRepository.update(user.id, updateUserDto);
    return this.findMe();
  }

  // GET /api/v1/users/me/profile
  async getMyProfile() {
    const profile = await this.profileRepository.findOne({
      where: { userId: this.currentUserId },
    });
    if (!profile) throw new NotFoundException('Профиль не найден');
    return profile;
  }

  // PUT /api/v1/users/me/profile
  async updateMyProfile(updateProfileDto: UpdateProfileDto) {
    let profile = await this.profileRepository.findOne({
      where: { userId: this.currentUserId },
    });

    if (!profile) {
      profile = this.profileRepository.create({
        userId: this.currentUserId,
        ...updateProfileDto,
      });
    } else {
      Object.assign(profile, updateProfileDto);
    }

    return this.profileRepository.save(profile);
  }

  // GET /api/v1/users/{userId}/profile
  async getProfileById(userId: string) {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Профиль не найден');
    return profile;
  }

  // POST /api/v1/users/me/profile/avatar
  async uploadAvatar(file: Express.Multer.File) {
    const user = await this.usersRepository.findOne({
      where: { id: this.currentUserId },
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const avatar = this.avatarRepository.create({
      userId: this.currentUserId,
      url: `/uploads/${file.filename}`,
    });

    await this.avatarRepository.save(avatar);

    const profile = await this.profileRepository.findOne({
      where: { userId: this.currentUserId },
    });

    if (profile) {
      profile.avatar_id = avatar.id;
      await this.profileRepository.save(profile);
    }

    return avatar;
  }

  // DELETE /api/v1/users/me/profile/avatar
  async deleteAvatar() {
    const user = await this.usersRepository.findOne({
      where: { id: this.currentUserId },
      relations: ['avatars'],
    });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (!user.avatars || user.avatars.length === 0) {
      throw new BadRequestException('Аватар не найден');
    }

    const avatar = user.avatars[0];
    const filePath = path.join(__dirname, '..', '..', avatar.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await this.avatarRepository.delete(avatar.id);

    const profile = await this.profileRepository.findOne({
      where: { userId: this.currentUserId },
    });

    if (profile) {
      profile.avatar_id = null;
      await this.profileRepository.save(profile);
    }

    return { message: 'Аватар успешно удален' };
  }
}