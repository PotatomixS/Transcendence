import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { AuthDto } from './dto';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }
    
    @Post('sign')
    signup(@Body() str) {
        // return this.authService.sign(dto);
        return this.authService.sign(str);
    }
}