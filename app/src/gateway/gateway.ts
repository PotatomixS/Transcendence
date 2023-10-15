// WebSocket ibs 

import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

// Prisna libs

import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClient, Prisma } from '@prisma/client'

@WebSocketGateway({cors: {origin: '*'}})
export class MyGateway
{
	constructor(
		private prisma: PrismaService,
	) {}

	@WebSocketServer()
	server: Server;



	//	Records the Socket Id

	onModuleInit()
	{
		this.server.on('connection', (socket) =>
		{
			console.log(socket.id);
			console.log('Connected');
		})
	}




	// Waits for a message to be recieved

	@SubscribeMessage('newMessage')
	onNewMessage(@MessageBody() body: any)
	{
		// this.ft_get_user();
		
		console.log(body);
		this.server.emit('onMessage',
		{
			user: 'NewMessage', 
			conent: body,
		});
	}
}




















	// async ft_get_user()
	// {
	// 	const user = await this.prisma.user.findUnique
	// 	({
	// 		where: 
	// 		{
	// 			login_42: "ahernand",
	// 		},
	// 	});
	// 	console.log(user);
	// }
