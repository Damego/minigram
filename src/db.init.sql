-- Создание базы данных
CREATE DATABASE user_api;

-- Подключение к базе данных
\c user_api;

-- Таблица пользователей
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  hashed_password VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  refresh_token VARCHAR(500) NULL,
  refresh_token_expires_at TIMESTAMP NULL
);

-- Таблица профилей
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  avatar_id UUID,
  birthday DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица аватаров
CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_avatars_user_id ON avatars(user_id);