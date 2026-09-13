import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/common/roles.decorator';
import { UserRole } from 'generated/prisma/enums';
import { CreateAdminDto } from './dto/create-admin.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService){}

    @Post('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Create an administrator',
        description: 'Creates a new administrator'
    })
    @ApiResponse({
        status: 201,
        description: 'Administrator created successfully'
    })
    @ApiResponse({
        status: 401,
        description: 'Authentication required'
    })
    @ApiResponse({
        status: 403,
        description: 'Only administrators can create administrators'
    })
    @ApiResponse({
        status: 409,
        description: 'Email already exists'
    })
    async createAdmin(@Body() createAdminDto: CreateAdminDto){
        return this.usersService.createAdmin(createAdminDto)
    }


}
