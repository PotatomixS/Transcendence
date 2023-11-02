import { Controller, Get, Post, Res, UseGuards, Body, UseInterceptors, UploadedFile, StreamableFile, Param } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { diskStorage } from "multer";
import { extname } from "path";

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {

    constructor(private userService: UserService) {
    }

    @Post('profileInfo')
    getProfileInfo(@Body() str) {
        return this.userService.getProfileInfo(str);
    }

    @Post('profileInfoImage')
    getProfileImage(@Body() str, @Res({ passthrough: true }) res: Response): StreamableFile {
        console.log("IMAGE: " + str.image);
        const file = createReadStream(join(process.cwd(), 'upload/images/' + str.image));
        return new StreamableFile(file);
    }

    @Post('profileInfoMatches')
    getProfileInfoMatches(@Body() str) {
        return this.userService.getProfileMatches(str);
    }

    @Post('setProfileInfo')
    setProfileInfo(@Body() str) {
        return this.userService.setProfileInfo(str);
    }

    @Post('setProfileInfoImage')
    @UseInterceptors(FileInterceptor('file', {
        dest: "upload/images/",
        storage
    }))
        uploadFile(@UploadedFile() file: Express.Multer.File)
    {
        console.log(file);
        return file;
    }
}

export const storage = diskStorage({
    destination: "upload/images/",
    filename: (req, file, callback) => {
      callback(null, generateFilename(file));
    }
  });
  
  function generateFilename(file) {
    return `${Date.now()}.${extname(file.originalname)}`;
  }