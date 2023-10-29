import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClient, Prisma } from '@prisma/client'





@WebSocketGateway({cors: {origin: '*'}})
export class MyGateway
{
	constructor( private prisma: PrismaService,	) {}
	@WebSocketServer()
	server: Server;




	/*
	**		___________________     Get Socket at start     ___________________
	*/

	onModuleInit()
	{
		this.server.on('connection', (socket) =>
		{
			this.server.to(socket.id).emit('InitSocketId', socket.id);
		})
	}
 



	@SubscribeMessage('newUserAndSocketId')
	onNewUserAndSocketId(@MessageBody() body: any)
	{
		body.userName = "ahernand";  //		Borrar
		this.ft_get_user(body.userName, body.socketId);
	}




	async ft_get_user(userName: String, p_socketId: String)
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
			user.socketId = String(p_socketId);

			await this.prisma.user.update
			({
				where:
				{
					id: user.id
				},
				data:
				{
					socketId: String(p_socketId),
				},
			});
		}
	}








	/*
	**		______________     Receive and distribute a message     ______________
	*/

	@SubscribeMessage('newMessage')
	onNewMessage(@MessageBody() body: any)
	{
		const msg: string = String(body.message);

		body.user = "ahernand";								// Borrar

		if (msg.startsWith("/join"))
		{
			this.ft_join(body);
		}
		else if (msg.startsWith("/dm"))
		{
			this.ft_dm(body);
		}
		else if (msg.startsWith("/leave"))
		{
			this.ft_leave(body);
		}
		else
		{
			this.ft_send(body);
		}
	}








	/*
	**		_________________________     ft_join     _________________________
	*/
	
	async ft_join(body: any)
	{

		//              ______     Busca y crea canales     ______
		
		const msg: string = String(body.message);
		
		var startIndex = msg.indexOf(" ") + 1;
		
		var channelName = msg.substring(startIndex);
		
		
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
		
		
		// 			 _____     Crea y elimina JoinedChannels     _____
		
		const join_channel = await this.prisma.joinedChannels.findUnique
		({
			where:
			{
				idUser: body.user,
				idChannel: channelName,
			},
		});
		
		if (join_channel)
		{
			const deleteUser = await this.prisma.joinedChannels.delete
			({
				where:
				{
					idUser: body.user,
				},
			})
		}
		
		const joined_channel_table = await this.prisma.joinedChannels.create
		({
			data:
			{
				idUser: body.user,
				idChannel: channelName,
			},
		});
	}
	
	
	

	



	/*
	**		_________________________     ft_leave     _________________________
	*/
	
	async  ft_leave(body: any)
	{
		const isUserinJoinedChannel = await this.prisma.joinedChannels.findUnique
		({
			where:
			{
				idUser: body.user,
			},
		});

		if (isUserinJoinedChannel)
		{
			const deleteUser = await this.prisma.joinedChannels.delete
			({
				where:
				{
					idUser: body.user,
				},
			})
		}
	}








	/*
	**		_________________________     ft_dm     _________________________
	*/

	async ft_dm(body: any)
	{
		
		//              ______     Busca y crea canales     ______

		const words = body.message.split(' ');
		const actual_message = words[words.length - 1];

		const user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: String(body.user),
			},
		});

		if (user)
		{
			this.server.to(user.socketId).emit('onMessage',
			{
				user: body.userName,
				message: "[private] " + actual_message,
			});
		}
	}








	/*
	**		_________________________     ft_emit     _________________________
	*/


	async ft_send(body: any)
	{
		const channel_user = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: body.user,
			},
		});

		if (channel_user)
		{
			const joinedChannels = await this.prisma.joinedChannels.findMany
			({
				where:
				{
					idChannel: channel_user.idChannel,
				},
			});


			for (const joinedChanel_gotten of joinedChannels)
			{

				const user_to_find = await this.prisma.user.findUnique
				({
					where:
					{
						login_42: joinedChanel_gotten.idUser,
					},
				});
				this.server.to(user_to_find.socketId).emit('onMessage',
				{
					user: body.userName,
					message: body.message,
				});
			}
		}
	}
}