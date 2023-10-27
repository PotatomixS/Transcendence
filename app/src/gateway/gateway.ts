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

			this.server.to(socket.id).emit('InitSocketId', socket.id);
		})
	}
 



	// Waits for a message to be recieved

	@SubscribeMessage('newMessage')
	onNewMessage(@MessageBody() body: any)
	{
		const msg: string = String(body.message);

		if (msg.startsWith("/join"))
		{
			var startIndex = msg.indexOf(" ") + 1;
			var room = msg.substring(startIndex);

			console.log(room);
			this.ft_join_channel(room, body.userName);
			this.ft_emit(room);
		}

		/*
		if (body.startsWith("/dm"))
		{
			var startIndex = body.indexOf(" ") + 1;
			var user_parsed = body.substring(startIndex);

			console.log(user_parsed);
		}
		else
		{
			this.server.emit('onMessage',
			{
				user: body.userName,
				message: body.message,
			});
		}*/
	}
	
	async ft_join_channel(channelName: string, user: string)
	{
		// Create Channels

		const channel_exists = await this.prisma.channel.findUnique
		({
			where:
			{
				Name: channelName,
			},
		});

		if (!channel_exists)
		{
			const channel8 = await this.prisma.channel.create
			({
				data:
				{
					Name: channelName,
					Password: "pass_add",
				},
			});
		}


		//exit channel that was on 

		// Join list on server

		const join_channel = await this.prisma.joinedChannels.findUnique
		({
			where:
			{
				idUser: user,
			},
		});

		if (!join_channel)
		{
			const joined_channel_table = await this.prisma.joinedChannels.create
			({
				data:
				{
					idUser: user,
					idChannel: channelName,
				},
			});
		}
	}

	async ft_emit(channelName: string)
	{
	    const joinedChannels = await this.prisma.joinedChannels.findMany
		({
			where:
			{
				parameter: channelName,
			},
		});




	}




































	// Waits for a user to register in the db


	@SubscribeMessage('newUserAndSocketId')
	onNewUserAndSocketId(@MessageBody() body: any)
	{
		
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
		

		if (user)
		{
			user.socketId = String(socketId);
		}
	}
}

