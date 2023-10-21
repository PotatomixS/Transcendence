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

			this.server.to(socket.id).emit('InitSocketId', socket.id);
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
			user: 'USER',
			message: body,
		});
	}





	// Waits for a user to register in the db


	@SubscribeMessage('newUserAndSocketId')
	onNewUserAndSocketId(body: any)
	{
		console.log(body.userName);
		this.ft_get_user(body.userName, body.socketId);
	}




	async ft_get_user(userName: String, socketId: String)
	{
		const user = await this.prisma.user.findUnique
		({
			where: 
			{
				login_42: String(userName),
			},
		});
		// user.socketId = String(socketId);
		// console.log(user);
	}
}