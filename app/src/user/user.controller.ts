import { Controller, Get, Post, Res, UseGuards, Body, UseInterceptors, UploadedFile, StreamableFile } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
    constructor(private userService: UserService) { }

    @Post('profileInfo')
    getProfileInfo(@Body() str) {
        return this.userService.getProfileInfo(str);
    }

    @Get('profileInfoImage')
    getProfileImage(@Res({ passthrough: true }) res: Response): StreamableFile {
        const file = createReadStream(join(process.cwd(), 'upload/images/default_user.png'));
        return new StreamableFile(file);
    }

    @Post('setProfileInfo')
    setProfileInfo(@Body() str) {
        return this.userService.setProfileInfo(str);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
        uploadFile(@UploadedFile() file: Express.Multer.File) {
        console.log(file);
    }
}