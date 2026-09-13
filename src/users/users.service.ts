import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Prisma, UserRole } from 'generated/prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { PasswordService } from '../auth/password/password.service'

interface CreateUserInput{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    
    
    constructor(
        private readonly database: DatabaseService, 
        private readonly passwordService: PasswordService
    ){}

    private normalizeEmail(email: string): string{
        return email.trim().toLowerCase();
    }
    
    async create(input: CreateUserInput){
        const email = this.normalizeEmail(input.email)
        try{
            return await this.database.user.create({
                data: {
                    email,
                    password: input.password,
                    firstName: input.firstName.trim(),
                    lastName: input.lastName.trim()
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true
                }
            })
        }
        catch(err){
            if(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'){
                throw new ConflictException('An account with this email already exists')
            }
            this.logger.error('Failed to create user', err instanceof Error ? err.stack: undefined)

            throw new InternalServerErrorException('Unable to create user')
        }

    }

    async findByEmail(email: string){
        return this.database.user.findUnique({
            where: {email: this.normalizeEmail(email)}
        })
    }

    async findById(id: string){
        return this.database.user.findUnique({
            where: {id},
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        })
    }

    async createAdmin(input: CreateUserInput){
        const email = input.email.trim().toLowerCase();

        try {
            const passwordHash = await this.passwordService.hash(input.password)

            return await this.database.user.create({
                data: {
                    email,
                    password: passwordHash,
                    firstName: input.firstName.trim(),
                    lastName: input.lastName.trim(),
                    role: UserRole.ADMIN
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    createdAt: true
                }
            })
        } catch (error) {
            if(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'){
                throw new ConflictException('A user with this email already exists')
            }
            throw error
        }
    }
}
