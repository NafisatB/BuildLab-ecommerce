import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class CreateAdminDto {
    @ApiProperty({
        example: 'admin@example.com',
        description: 'Administrator email address'
    })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'StrongAdminPassword123!',
        description:
            'Administrator password. Must contain uppercase, lowercase, number and special character.',
        minLength: 8,
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    @MaxLength(128)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, {
        message: 'Password must contain uppercase, lowercase, number and special character',
    })
    password!: string;

    @ApiProperty({
        example: 'System',
        description: 'Administrator first name',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    firstName!: string;

    @ApiProperty({
        example: 'Administrator',
        description: 'Administrator last name',
    })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    lastName!: string;

}
