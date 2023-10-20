import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { User } from '@prisma/client';
//import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
    constructor(private userService: UserService) { }

    @Post('profileInfo')
    getProfileInfo(@Body() str) {
        return this.userService.getProfileInfo(str);
    }

    @Post('setProfileInfo')
    setProfileInfo(@Body() str) {
        return this.userService.setProfileInfo(str);
    }
}