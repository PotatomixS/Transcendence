import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from 'src/auth/strategy';

@Module({
  imports: [JwtModule.register({})],
  controllers: [UserController],
  providers: [UserService, JwtStrategy]
})
export class UserModule {}
