import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /api/v1/users/me
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    this.usersService.setCurrentUserId(req.user.sub);
    return this.usersService.findMe();
  }

  // PUT /api/v1/users/me
  @UseGuards(JwtAuthGuard)
  @Put('me')
  updateMe(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    this.usersService.setCurrentUserId(req.user.sub);
    return this.usersService.updateMe(updateUserDto);
  }

  // GET /api/v1/users/me/profile
  @UseGuards(JwtAuthGuard)
  @Get('me/profile')
  getMyProfile(@Request() req) {
    this.usersService.setCurrentUserId(req.user.sub);
    return this.usersService.getMyProfile();
  }

  // PUT /api/v1/users/me/profile
  @UseGuards(JwtAuthGuard)
  @Put('me/profile')
  updateMyProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    this.usersService.setCurrentUserId(req.user.sub);
    return this.usersService.updateMyProfile(updateProfileDto);
  }

  // GET /api/v1/users/{userId}/profile
  @Get(':userId/profile')
  getProfileById(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.getProfileById(userId);
  }

  // POST /api/v1/users/me/profile/avatar
  @UseGuards(JwtAuthGuard)
  @Post('me/profile/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
          return cb(new Error('Только изображения разрешены'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadAvatar(@UploadedFile() file: Express.Multer.File, @Request() req) {
    this.usersService.setCurrentUserId(req.user.sub);
    return this.usersService.uploadAvatar(file);
  }

  // DELETE /api/v1/users/me/profile/avatar
  @UseGuards(JwtAuthGuard)
  @Delete('me/profile/avatar')
  deleteAvatar(@Request() req) {
    this.usersService.setCurrentUserId(req.user.sub);
    return this.usersService.deleteAvatar();
  }
}