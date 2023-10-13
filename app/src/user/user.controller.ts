import { Controller, Get, Post, Patch, UseGuards, Body } from '@nestjs/common';
import { User } from '@prisma/client';
//import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {

    /*@Patch()
    editUser() {

    }*/
}