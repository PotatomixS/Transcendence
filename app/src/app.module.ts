import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

//estos estan de forma temporal
import { AppService } from './app.service';
import { AppController } from './app.controller';


// import { ChatModule } from './chat/chat.module';
// import { MessagesModule } from './messages/messages.module';

import { GatewayModule } from './gateway/gateway.module';



@Module({
  imports:  [
    AuthModule,
    UserModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // ChatModule,
    // MessagesModule,
    GatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
