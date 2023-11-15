import { Controller, Get, Post, Res, UseGuards, Body, UseInterceptors, UploadedFile, StreamableFile, Param, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, HttpStatus } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guard';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { MulterError, diskStorage } from "multer";
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
        const file = createReadStream(join(process.cwd(), 'upload/images/' + str.image));
        return new StreamableFile(file);
    }

    @Post('addFriend')
    addFriend(@Body() str) {
        return this.userService.addFriend(str);
    }

    @Post('removeFriend')
    removeFriend(@Body() str) {
        return this.userService.removeFriend(str);
    }

    @Post('getIfFriends')
    getIfFriends(@Body() str) {
        return this.userService.getIfFriends(str);
    }

    @Post('profileInfoMatches')
    getProfileInfoMatches(@Body() str) {
        return this.userService.getProfileMatches(str);
    }

    @Post('getCurrentMatch')
    getCurrentMatch(@Body() str) {
        return this.userService.getCurrentMatch(str);
    }

    @Post('profileInfoChallenges')
    getProfileInfoChallenges(@Body() str) {
        return this.userService.getProfileChallenges(str);
    }

    @Post('cancelFind')
    cancelFind(@Body() str) {
        return this.userService.cancelFind(str);
    }

    @Post('findMatch')
    findMatch(@Body() str) {
        return this.userService.findMatch(str);
    }

    @Post('acceptChallenge')
    acceptChallenge(@Body() str) {
        return this.userService.acceptChallenge(str);
    }

    @Post('setProfileInfo')
    setProfileInfo(@Body() str) {
        return this.userService.setProfileInfo(str);
    }

    @Post('setProfileInfoImage')
    @UseInterceptors(FileInterceptor('file', {
        fileFilter: (req, file, cb) => {
            const fileSize = parseInt(req.headers["content-length"])

            if (file.originalname.match(/^.*\.(jpg|webp|png|jpeg)$/))
            {
                if (fileSize <= 256 * 1024 * 1024)
                    cb(null, true);
                else
                    cb(null, false);
            }
            else {
                cb(null, false);
            }
        },
        dest: "upload/images/",
        storage,
    }))
        uploadFile(@UploadedFile() file: Express.Multer.File)
    {
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