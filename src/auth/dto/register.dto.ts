import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
    @ApiProperty({
        example: 'customer12@example.com',
        description: 'Customer email address'
    })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'StrongPassword123!',
        description: 'Account password',
        minLength: 12
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(12)
    @Matches(/[A-Z]/, {
        message: 'Password must contain at least one uppercase letter',
    })
    @Matches(/[a-z]/, {
        message: 'Password must contain at least one lowercase letter',
    })
    @Matches(/[0-9]/, {
        message: 'Password must contain at least one number',
    })
    @Matches(/[^A-Za-z0-9]/, {
        message: 'Password must contain at least one special character',
    })
    password: string;

    @ApiProperty({
        example: 'John',
        description: 'Customer first name'
    })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({
        example: 'Doe',
        description: 'Customer last name'
    })
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty()
    lastName: string;
}
