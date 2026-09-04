import { Module } from '@nestjs/common';
import { PasswordService } from './password/password.service';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        ConfigModule,
        UsersModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET');

                if (!secret) {
                    throw new Error('JWT_SECRET is not configured')
                }
                return {
                    secret,
                    signOptions: { expiresIn: '15m' }
                }
            }
        })
    ],
    controllers: [AuthController],
    providers: [PasswordService, AuthService, JwtStrategy],
    exports: [PasswordService, AuthService]
})
export class AuthModule { }
