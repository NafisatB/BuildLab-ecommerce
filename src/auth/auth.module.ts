import { Module } from '@nestjs/common';
import { PasswordService } from './password/password.service';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports: [UsersModule],
    providers: [PasswordService, AuthService],
    exports: [PasswordService, AuthService]
})
export class AuthModule {}
