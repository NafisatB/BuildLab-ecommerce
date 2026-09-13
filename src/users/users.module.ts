import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PasswordService } from 'src/auth/password/password.service';

@Module({
    imports: [DatabaseModule],
    providers: [UsersService, PasswordService],
    exports: [UsersService],
    controllers: [UsersController]
})
export class UsersModule {}
