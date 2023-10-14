import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets';

@WebSocketGateway({cors: {origin: '*'}})
export class MyGateway
{
	@SubscribeMessage('newMessage')
	onNewMessage(@MessageBody() body: any)
	{
		console.log(body);
	}
}