import { Module } from '@nestjs/common'
import { MyGateway } from './gateway';

// import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';
// import { MessagesService } from './messages.service';
// import { CreateMessageDto } from './dto/create-message.dto';
// import { UpdateMessageDto } from './dto/update-message.dto';

@Module({
    providers: [MyGateway]
})

export class GatewayModule {}