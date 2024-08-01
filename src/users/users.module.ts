import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { UserProcessor } from './user.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'register',
    }),
    BullBoardModule.forRoot({
      route: '/queue',
      adapter: ExpressAdapter,
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserProcessor],
})
export class UsersModule {}
