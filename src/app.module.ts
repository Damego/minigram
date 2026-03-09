import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FriendsModule } from './friends/friends.module';
import { User } from './users/entities/user.entity';
import { Profile } from './users/entities/profile.entity';
import { Avatar } from './users/entities/avatar.entity';
import { Contact } from './friends/entities/contact.entity';
import { ConfigModule as CustomConfigModule } from './config/config.module';
import { CustomConfigService } from './config/custom-config.service';

@Module({
  imports: [
    // ✅ Наш кастомный ConfigModule
    CustomConfigModule,
    
    // ✅ TypeOrmModule с использованием CustomConfigService
    TypeOrmModule.forRootAsync({
      useFactory: (configService: CustomConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('db.host'),
        port: configService.get<number>('db.port'),
        username: configService.get<string>('db.username'),
        password: configService.get<string>('db.password'),
        database: configService.get<string>('db.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [CustomConfigService],
    }),
    
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    
    UsersModule,
    AuthModule,
    FriendsModule,
  ],
})
export class AppModule {}