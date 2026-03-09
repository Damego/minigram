import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomConfigService } from '../config/custom-config.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: CustomConfigService,
  ) {}

  // ✅ Регистрация пользователя
  async register(registerDto: RegisterDto) {
    const { email, username, password, display_name, birthday } = registerDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email уже занят');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersService.createUser({
      email,
      username,
      hashed_password: hashedPassword,
    });

    if (display_name || birthday) {
      await this.usersService.updateMyProfile({
        display_name,
        birthday,
      });
    }

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  // ✅ Вход пользователя
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const tokens = await this.generateTokens(user);
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  // ✅ Обновление JWT токенов
  async refresh(refreshDto: RefreshDto) {
    const { refresh_token } = refreshDto;

    if (!refresh_token) {
      throw new BadRequestException('Refresh token не предоставлен');
    }

    // Проверяем валидность refresh токена
    try {
      const payload = this.jwtService.verify(refresh_token, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      // Проверяем, существует ли пользователь
      const user = await this.usersService.findByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException('Пользователь не найден');
      }

      // Проверяем, совпадает ли refresh токен в БД
      if (user.refresh_token !== refresh_token) {
        throw new UnauthorizedException('Неверный refresh токен');
      }

      // Проверяем срок действия
      if (user.refresh_token_expires_at && new Date() > user.refresh_token_expires_at) {
        throw new UnauthorizedException('Refresh токен истек');
      }

      // Генерируем новые токены
      const tokens = await this.generateTokens(user);
      return {
        ...tokens,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Неверный или истекший refresh токен');
    }
  }

  // ✅ Генерация токенов
  private async generateTokens(user: any) {
    // Access token (короткоживущий)
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn'),
      },
    );

    // Refresh token (долгоживущий)
    const refreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
      },
    );

    // Сохраняем refresh токен в БД
    await this.usersService.updateRefreshToken(user.id, refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // ✅ Выход пользователя (очистка refresh токена)
  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'Успешный выход' };
  }

  // Валидация JWT токена
  async validateUser(payload: any) {
    const user = await this.usersService.findByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    return user;
  }

  // Получение пользователя по ID
  async getUserById(userId: string) {
    const user = await this.usersService.findMe();
    if (user.id !== userId) {
      throw new UnauthorizedException('Доступ запрещен');
    }
    return user;
  }
}