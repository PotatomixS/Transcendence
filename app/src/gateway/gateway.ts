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
		console.log(body.userName);

		// body.user = "ahernand";								// Borrar

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
		else if (msg.startsWith("/block"))
		{
			this.ft_block(body);
		}
		else if (msg.startsWith("/unblock"))
		{
			this.ft_unblock(body);
		}
		else if (msg.startsWith("/list"))
		{
			this.ft_list(body);
		}
		else
		{
			this.ft_send(body);
		}
		//profile
	}








	/*
	**		_________________________     ft_join     _________________________
	*/
	
	async ft_join(body: any)
	{

		//              ______     Echar si ya está joineado     ______
		
		const is_on_channel_alredy = await this.prisma.joinedChannels.findUnique
		({
			where:
			{
				idUser: body.userName,
			},
		});

		if (is_on_channel_alredy)
		{
			const this_user = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: body.userName,
				},
			});
		
			this.server.to(this_user.socketId).emit('onMessage',
			{
				user: "Server",
				message: "You are alredy in a channel, joputa",
			});
		}


		if (!is_on_channel_alredy)
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
					idUser: body.userName,
					idChannel: channelName,
				},
			});
			
			if (join_channel)
			{
				const deleteUser = await this.prisma.joinedChannels.delete
				({
					where:
					{
						idUser: body.userName,
					},
				})
			}
			
			const joined_channel_table = await this.prisma.joinedChannels.create
			({
				data:
				{
					idUser: body.userName,
					idChannel: channelName,
				},
			});
		}
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
				idUser: body.userName,
			},
		});

		if (isUserinJoinedChannel)
		{
			const deleteUser = await this.prisma.joinedChannels.delete
			({
				where:
				{
					idUser: body.userName,
				},
			})
		}
	}








	/*
	**		_________________________     ft_dm     _________________________
	*/

	async ft_dm(body: any)
	{
		
		//              ______     divide las palabras     ______

		const words = body.message.split(' ');
		const actual_message = words.slice(2).join(' ');

		const user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: String(words[1]),
			},
		});

		const isBlocked = await this.prisma.blockedUsers.findFirst
		({
			where:
			{
				userBlocked: String(user.login_42),
				userBlocker: String(body.userName),
			},
		});
		
		const urBlocked = await this.prisma.blockedUsers.findFirst
		({
			where:
			{
				userBlocked: String(body.userName),
				userBlocker: String(user.login_42),
			},
		});



		
		if (user && !isBlocked && !urBlocked)
		{
			this.server.to(user.socketId).emit('onMessage',
			{
				user: body.userName,
				message: "[private] " + actual_message,
			});
		}
	}








	/*
	**		_______________________     ft_block     _______________________
	*/

	async ft_block(body: any)
	{
		//              ______     buscar persona a bloquear     ______

		const words = body.message.split(' ');

		const user2block = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: String(words[1]),
			},
		});

		//              ______     Meterla en la tabla de blocks     ______
		if (user2block && user2block.login_42 != body.userName)
		{
			console.log("Asado");
			const blockCard = await this.prisma.blockedUsers.create
			({
				data:
				{
					userBlocker: body.userName,
					userBlocked: words[1],
				},
			});
		}
	}








	/*
	**		_______________________     ft_unblock     _______________________
	*/

	async ft_unblock(body: any)
	{
		//              ______     buscar persona a bloquear     ______

		const words = body.message.split(' ');

		const user2unblock = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: String(words[1]),
			},
		});

		//              ______     Meterla en la tabla de blocks     ______
		if (user2unblock)
		{
			const toUnBlockTable = await this.prisma.blockedUsers.findFirst
			({
				where:
				{
					userBlocker: body.userName,
					userBlocked: words[1],
				},
			});

			console.log("UnPalacios");
			const blockCard = await this.prisma.blockedUsers.delete
			({
				where:
				{
					id: toUnBlockTable.id,
				},
			});
		}
	}




	/*
	**		_______________________     ft_list     _______________________
	*/

	async ft_list(body: any)
	{
		//              ______     buscar channels     ______

		const this_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		const all_channels = await this.prisma.channel.findMany
		({
			where:
			{
			},
		});
		
		this.server.to(this_user.socketId).emit('onMessage',
		{
			user: "",
			message: "Channels:",
		});
		
		for (const each_channel of all_channels)
		{
			this.server.to(this_user.socketId).emit('onMessage',
			{
				user: "",
				message: ("-   " + each_channel.Name),
			});
		}
	}








	/*
	**		_________________________     ft_send     _________________________
	*/


	async ft_send(body: any)
	{
		//       ______     Encuentra el canal en el que está el user que envía     ______
		
		const channel_user = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: body.userName,
			},
		});
		
		//       ______     Encuentra todos los joinedChannels con todos los users de ese canal     ______
		
		if (channel_user)
		{
			const joinedChannels = await this.prisma.joinedChannels.findMany
			({
				where:
				{
					idChannel: channel_user.idChannel,
				},
			});
			
			
			//       ______     Saca el user de la string y se los envvía       ______

			for (const joinedChanel_gotten of joinedChannels)
			{
				const isBlocked = await this.prisma.blockedUsers.findFirst
				({
					where:
					{
						userBlocked: String(joinedChanel_gotten.idUser),
						userBlocker: String(body.userName),
					},
				});
				
				const urBlocked = await this.prisma.blockedUsers.findFirst
				({
					where:
					{
						userBlocked: String(body.userName),
						userBlocker: String(joinedChanel_gotten.idUser),
					},
				});



				if (!isBlocked && !urBlocked)
				{
					const user_to_find = await this.prisma.user.findUnique
					({
						where:
						{
							login_42: joinedChanel_gotten.idUser,
						},
					});

					// const USERNICKNAME = await this.prisma.user.findUnique
					// ({
					// 	where:
					// 	{
					// 		login_42: body.userName,
					// 	},
					// });

					this.server.to(user_to_find.socketId).emit('onMessage',
					{
						// user: USERNICKNAME.nickname,
						user: body.userName,
						message: "[" + channel_user.idChannel + "] "  + body.message,
					});
				}
			}
		}
	}
}