import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

export interface Config {
  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  server: {
    port: number;
  };
}

@Injectable()
export class CustomConfigService {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
  }

  // Загрузка конфигурации из .env файла
  private loadConfig(): Config {
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    } else {
      console.warn('Файл .env не найден, используются значения по умолчанию');
    }

    return {
      db: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'user_api',
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      },
      server: {
        port: parseInt(process.env.PORT || '3000', 10),
      },
    };
  }

  // Получение значения конфигурации
  get<T>(key: string): T {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value === undefined || value === null) {
        throw new Error(`Конфигурация "${key}" не найдена`);
      }
      value = value[k];
    }

    return value as T;
  }

  // Получение всей конфигурации
  getAll(): Config {
    return this.config;
  }

  // Получение значения с дефолтом
  getOrDefault<T>(key: string, defaultValue: T): T {
    try {
      return this.get<T>(key);
    } catch {
      return defaultValue;
    }
  }
}