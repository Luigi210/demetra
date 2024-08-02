import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('/get-user-by-id')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('cachedUser')
  @CacheTTL(1800)
  findAll(@Query() query: { id: number }) {
    const { id } = query;
    return this.usersService.getUserById(id);
  }
}
