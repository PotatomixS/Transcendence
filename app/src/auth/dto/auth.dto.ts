import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthDto{
    @IsNotEmpty()
    _login_42: string;
    
}
