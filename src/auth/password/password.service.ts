import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import * as argon2  from 'argon2';

@Injectable()
export class PasswordService {
 private readonly logger = new Logger(PasswordService.name);

 async hash(password: string): Promise<string>{
    try{
        return await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 19_456,
            timeCost: 2,
            parallelism: 1
        })
    }
    catch(error){
        this.logger.error(
            'Password hashing failed', error instanceof Error ? error.stack: undefined
        )
        throw new InternalServerErrorException('Unable to process password')
    }
 }

 async verify(passwordHash: string, password: string) : Promise<boolean>{
    try{
        return await argon2.verify(passwordHash, password)
    }
    catch(err){
        this.logger.error('Password verification failed', err instanceof Error ? err.stack: undefined)

        throw new InternalServerErrorException('Unable to verify password')
    }
 }

}
