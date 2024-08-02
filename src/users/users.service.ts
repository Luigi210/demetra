import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { NotFoundError } from 'rxjs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectQueue('register') private queue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async addJob(data: any) {
    await this.queue.add('change-status', data);
  }

  async create(createUserDto: CreateUserDto) {
    const found = await this.userRepository.findOne({
      where: {
        email: createUserDto.email,
      },
    });

    if (found) {
      throw new BadRequestException('ERR_USER_EMAIL_EXISTS');
    }

    const hash = await bcrypt.hash(
      createUserDto.password,
      createUserDto.password.length,
    );

    const user = {
      email: createUserDto.email,
      password: hash,
      name: createUserDto.name,
    } as User;

    const created = this.userRepository.create(user);
    const saved = await this.userRepository.save(created);

    await this.queue.add('status', { id: saved.id }, { delay: 10000 });

    return {
      status: 200,
      message: 'SUCCESS',
    };
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundError('ERR_USER_NOT_FOUND');
    }

    return { statusCode: 200, message: 'SUCCESS', user };
  }

  async updateUserStatus(userId: number) {
    return await this.userRepository.update({ id: userId }, { status: true });
  }

  async isEmailUnique(email: string) {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    return !existingUser;
  }
}
