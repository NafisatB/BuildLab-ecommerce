import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { PasswordService } from './password/password.service';
import { RegisterDto } from './dto/dto';
import { error } from 'console';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly usersService: UsersService,
        private readonly passwordService: PasswordService
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
}
