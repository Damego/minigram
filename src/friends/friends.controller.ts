import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // GET /api/v1/friends
  @UseGuards(JwtAuthGuard)
  @Get()
  getFriends(@Request() req) {
    return this.friendsService.getFriends();
  }

  // POST /api/v1/friends/{userId}/status
  @UseGuards(JwtAuthGuard)
  @Post(':userId/status')
  addFriend(
    @Param('userId') userId: string,
    @Body() createContactDto: CreateContactDto,
    @Request() req,
  ) {
    return this.friendsService.addFriend(userId, createContactDto);
  }

  // PUT /api/v1/friends/{userId}/status
  @UseGuards(JwtAuthGuard)
  @Put(':userId/status')
  updateFriendStatus(
    @Param('userId') userId: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.friendsService.updateFriendStatus(userId, updateContactDto);
  }

  // DELETE /api/v1/friends/{userId}/status/{id}
  @UseGuards(JwtAuthGuard)
  @Delete(':userId/status/:id')
  deleteFriend(
    @Param('userId') userId: string,
    @Param('id') contactId: string,
  ) {
    return this.friendsService.deleteFriend(userId, contactId);
  }

  // GET /api/v1/users?q=...
  @UseGuards(JwtAuthGuard)
  @Get('users')
  searchUsers(@Query() searchUsersDto: SearchUsersDto) {
    return this.friendsService.searchUsers(searchUsersDto);
  }

  // GET /api/v1/friends/requests
  @UseGuards(JwtAuthGuard)
  @Get('requests')
  getFriendRequests(@Request() req) {
    return this.friendsService.getFriendRequests();
  }

  // POST /api/v1/friends/requests/{id}/accept
  @UseGuards(JwtAuthGuard)
  @Post('requests/:id/accept')
  acceptFriendRequest(@Param('id') contactId: string) {
    return this.friendsService.acceptFriendRequest(contactId);
  }

  // POST /api/v1/friends/requests/{id}/reject
  @UseGuards(JwtAuthGuard)
  @Post('requests/:id/reject')
  rejectFriendRequest(@Param('id') contactId: string) {
    return this.friendsService.rejectFriendRequest(contactId);
  }

  // POST /api/v1/friends/{userId}/block
  @UseGuards(JwtAuthGuard)
  @Post(':userId/block')
  blockUser(@Param('userId') userId: string) {
    return this.friendsService.blockUser(userId);
  }

  // POST /api/v1/friends/{userId}/unblock
  @UseGuards(JwtAuthGuard)
  @Post(':userId/unblock')
  unblockUser(@Param('userId') userId: string) {
    return this.friendsService.unblockUser(userId);
  }
}