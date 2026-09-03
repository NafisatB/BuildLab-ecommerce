import { ConflictException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { DatabaseService } from 'src/database/database.service';

interface CreateUserInput{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    
    constructor(private readonly database: DatabaseService){}

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
}
