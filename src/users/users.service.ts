import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { NotFoundError } from 'rxjs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectQueue('register') private queue: Queue,
  ) {}

  async addJob(data: any) {
    await this.queue.add('change-status', data);
  }

  async create(createUserDto: CreateUserDto) {
    const user = this.userRepository.create(createUserDto);

    const found = await this.userRepository.findOne({
      where: {
        email: user.email,
      },
    });

    if (found) {
      throw new BadRequestException('ERR_USER_EMAIL_EXISTS');
    }
    const hash = await bcrypt.hash(
      createUserDto.password,
      createUserDto.password.length,
    );

    const savedUser = await this.userRepository.save({
      ...user,
      password: hash,
    });
    await this.queue.add('status', { id: savedUser.id }, { delay: 10000 });
    return {
      status: 200,
      message: 'SUCCESS',
    };
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({ where: { id: id } });

    if (!user) {
      throw new NotFoundError('ERR_USER_NOT_FOUND');
    }
    return user;
  }

  async updateUserStatus(userId: number) {
    return await this.userRepository.update({ id: userId }, { status: true });
  }
}
