import { ConflictException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { PasswordService } from './password/password.service';
import { RegisterDto } from './dto/register.dto';
import { error } from 'console';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly usersService: UsersService,
        private readonly passwordService: PasswordService,
        private readonly jwtService: JwtService
    ){}

    async register(registerDto: RegisterDto){
        const email = registerDto.email.trim().toLowerCase();
        const existingUser = await this.usersService.findByEmail(email);

        if(existingUser){
            throw new ConflictException('An account with this email already exists');
        }

        const passwordHash = await this.passwordService.hash(registerDto.password);

        try {
            const user = await this.usersService.create({
                email,
                password: passwordHash,
                firstName: registerDto.firstName,
                lastName: registerDto.lastName
            });

            return{
                message: 'Registration successful',
                user
            }
        } catch (error) {
            if(error instanceof ConflictException){throw error};
        }
        this.logger.error('User registration failed', error instanceof Error ? error.stack: undefined);

        throw new InternalServerErrorException('Unable to complete registration')
    }

    async login(loginDto: LoginDto){
        const email = loginDto.email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(email);

        if(!user){
            throw new UnauthorizedException('Invalid email or password')
        }

        const passwordValid = await this.passwordService.verify(
            user.password,
            loginDto.password
        );

        if(!passwordValid){
            throw new UnauthorizedException('Invalid email or password')
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };
        try {
            const accessToken = await this.jwtService.signAsync(payload);

            return{
                message: 'Login successful',
                accessToken,
                tokenType: 'Bearer',
                expiresIn: '15m',
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                }
            }
        } catch (error) {
            this.logger.error(
                'JWT generation failed', error instanceof Error ? error.stack: undefined
            );
            throw new InternalServerErrorException('Unable to complete login')
        }
    }

    async logout(user: {
        userId: string;
        email: string;
        role: string;
    }){
        return{message: 'Logout successful'}
    }
}
