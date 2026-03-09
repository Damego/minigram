import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact, ContactStatus } from './entities/contact.entity';
import { User } from '../users/entities/user.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Текущий ID пользователя (в реальном проекте — из JWT токена)
  private currentUserId: string = '1';

  // ✅ GET /api/v1/friends - Получить всех друзей
  async getFriends() {
    const contacts = await this.contactRepository.find({
      where: {
        userId: this.currentUserId,
        status: ContactStatus.FRIEND,
      },
      relations: ['friend', 'friend.profile', 'friend.avatars'],
    });

    return contacts.map((contact) => ({
      id: contact.friend.id,
      username: contact.friend.username,
      email: contact.friend.email,
      displayName: contact.friend.profile?.display_name,
      avatarUrl: contact.friend.avatars?.[0]?.url || null,
    }));
  }

  // ✅ POST /api/v1/friends/{userId}/status - Добавить друга
  async addFriend(userId: string, createContactDto: CreateContactDto) {
    const friend = await this.usersRepository.findOne({
      where: { id: userId },
    });
    if (!friend) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (friend.id === this.currentUserId) {
      throw new BadRequestException('Нельзя добавить себя в друзья');
    }

    // Проверка на существующий контакт
    const existingContact = await this.contactRepository.findOne({
      where: {
        userId: this.currentUserId,
        friendId: userId,
      },
    });

    if (existingContact) {
      throw new ConflictException('Заявка уже отправлена');
    }

    const contact = this.contactRepository.create({
      userId: this.currentUserId,
      friendId: userId,
      status: createContactDto.status || ContactStatus.REQUEST_SENT,
    });

    return await this.contactRepository.save(contact);
  }

  // ✅ PUT /api/v1/friends/{userId}/status - Обновить статус
  async updateFriendStatus(userId: string, updateContactDto: UpdateContactDto) {
    const contact = await this.contactRepository.findOne({
      where: {
        userId: this.currentUserId,
        friendId: userId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Контакт не найден');
    }

    if (updateContactDto.status) {
      contact.status = updateContactDto.status;
    }

    return await this.contactRepository.save(contact);
  }

  // ✅ DELETE /api/v1/friends/{userId}/status/{id} - Удалить друга/заявку
  async deleteFriend(userId: string, contactId: string) {
    const contact = await this.contactRepository.findOne({
      where: {
        id: contactId,
        userId: this.currentUserId,
      },
    });

    if (!contact) {
      throw new NotFoundException('Контакт не найден');
    }

    await this.contactRepository.delete(contactId);
    return { message: 'Друг/заявка удалена' };
  }

  // ✅ GET /api/v1/users?q=... - Поиск пользователей
  async searchUsers(searchUsersDto: SearchUsersDto) {
    const { q } = searchUsersDto;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.avatars', 'avatars')
      .where('user.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('user.id != :currentUserId', { currentUserId: this.currentUserId });

    if (q) {
      queryBuilder.andWhere(
        '(user.username ILIKE :search OR user.email ILIKE :search OR profile.display_name ILIKE :search)',
        { search: `%${q}%` },
      );
    }

    const users = await queryBuilder.getMany();

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.profile?.display_name,
      avatarUrl: user.avatars?.[0]?.url || null,
    }));
  }

  // ✅ Получить статус контакта
  async getContactStatus(userId: string) {
    const contact = await this.contactRepository.findOne({
      where: {
        userId: this.currentUserId,
        friendId: userId,
      },
    });

    if (!contact) {
      return { status: null, message: 'Контакт не найден' };
    }

    return {
      status: contact.status,
      createdAt: contact.created_at,
    };
  }

  // ✅ Получить заявки в друзья
  async getFriendRequests() {
    const contacts = await this.contactRepository.find({
      where: {
        friendId: this.currentUserId,
        status: ContactStatus.REQUEST_SENT,
      },
      relations: ['user', 'user.profile', 'user.avatars'],
    });

    return contacts.map((contact) => ({
      id: contact.user.id,
      username: contact.user.username,
      email: contact.user.email,
      displayName: contact.user.profile?.display_name,
      avatarUrl: contact.user.avatars?.[0]?.url || null,
      createdAt: contact.created_at,
    }));
  }

  // ✅ Принять заявку в друзья
  async acceptFriendRequest(contactId: string) {
    const contact = await this.contactRepository.findOne({
      where: {
        id: contactId,
        friendId: this.currentUserId,
        status: ContactStatus.REQUEST_SENT,
      },
    });

    if (!contact) {
      throw new NotFoundException('Заявка не найдена');
    }

    contact.status = ContactStatus.FRIEND;
    await this.contactRepository.save(contact);

    // Создаем взаимный контакт
    const mutualContact = this.contactRepository.create({
      userId: contact.userId,
      friendId: this.currentUserId,
      status: ContactStatus.FRIEND,
    });

    await this.contactRepository.save(mutualContact);

    return { message: 'Заявка принята' };
  }

  // ✅ Отклонить заявку в друзья
  async rejectFriendRequest(contactId: string) {
    const contact = await this.contactRepository.findOne({
      where: {
        id: contactId,
        friendId: this.currentUserId,
        status: ContactStatus.REQUEST_SENT,
      },
    });

    if (!contact) {
      throw new NotFoundException('Заявка не найдена');
    }

    await this.contactRepository.delete(contactId);
    return { message: 'Заявка отклонена' };
  }

  // ✅ Заблокировать пользователя
  async blockUser(userId: string) {
    const contact = await this.contactRepository.findOne({
      where: {
        userId: this.currentUserId,
        friendId: userId,
      },
    });

    if (contact) {
      contact.status = ContactStatus.BLOCKED;
      await this.contactRepository.save(contact);
    } else {
      const blockedContact = this.contactRepository.create({
        userId: this.currentUserId,
        friendId: userId,
        status: ContactStatus.BLOCKED,
      });
      await this.contactRepository.save(blockedContact);
    }

    return { message: 'Пользователь заблокирован' };
  }

  // ✅ Разблокировать пользователя
  async unblockUser(userId: string) {
    const contact = await this.contactRepository.findOne({
      where: {
        userId: this.currentUserId,
        friendId: userId,
        status: ContactStatus.BLOCKED,
      },
    });

    if (contact) {
      await this.contactRepository.delete(contact.id);
    }

    return { message: 'Пользователь разблокирован' };
  }
}