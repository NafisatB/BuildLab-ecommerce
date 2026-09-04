import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto{
    @ApiProperty({
        example: 'customer@example.com',
        description: 'Registered customer email address'
    })
    @Transform(({value})=> typeof value === 'string' ? value.trim().toLowerCase(): value)
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'StrongPassword123$',
        description: 'Account password'
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}