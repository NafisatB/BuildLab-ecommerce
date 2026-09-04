import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedRequest } from './types/authenticated-request';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { };

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Register a new customer',
        description: 'create a new customer account. Newly registered users are assigned the CUSTOMER role by default.'
    })
    @ApiCreatedResponse({ description: 'Customer account created successfully.' })
    @ApiBadRequestResponse({ description: 'Invalid registration data' })
    @ApiConflictResponse({ description: 'An account with the supplied email already exists' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto)
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Login user',
        description: 'Authenticates a registered user and returns a JWT access token'
    })
    @ApiOkResponse({ description: 'Login successful' })
    @ApiBadRequestResponse({ description: 'Invalid login data' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto)
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Get authenticated user',
        description: 'Returns the currently authenticated user.',
    })
    async me(@Req() request: 
    AuthenticatedRequest) {
        return {
            user: request.user,
        };
    }
}
