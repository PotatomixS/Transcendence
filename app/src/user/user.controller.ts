import { Controller, Post, UseGuards, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { User } from '@prisma/client';
//import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
    constructor(private userService: UserService) { }

    @Post('profileInfo')
    getProfileInfo(@Body() str) {
        return this.userService.getProfileInfo(str);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
        uploadFile(@UploadedFile() file: Express.Multer.File) {
        console.log(file);
    }
}