import { Processor, Process, OnQueueFailed, OnQueueError } from '@nestjs/bull';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@Processor('register')
export class UserProcessor {
  constructor(private userService: UsersService) {}

  @Process('status')
  async handleJob(job: Job<{ id: number }>) {
    const { id } = job.data;
    await this.userService.updateUserStatus(id);
  }
}
