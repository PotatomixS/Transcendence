import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClient, Prisma } from '@prisma/client'

var pos =
{
	player1_x: 15,
	player1_y: 405,
	player2_x: 1240,
	player2_y: 405,
	player1_p: 0,
	player2_p: 0,
	ball_x: 628,
	ball_y: 430,
	ball_ang: 0,
	ball_inc: 0
}

var keysPressed: { [key: string]: boolean } = {};

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
			this.gameLoop();
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
	
		const this_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		const is_on_channel_alredy = await this.prisma.joinedChannels.findUnique
		({
			where:
			{
				idUser: body.userName,
			},
		});

		if (is_on_channel_alredy)
		{
			this.server.to(this_user.socketId).emit('onMessage',
			{
				user: "Server",
				message: "You are alredy in a channel, joputa",
			});
		}


		if (!is_on_channel_alredy)
		{
			//              ______     Busca y crea canales     ______

			const words = body.message.split(' ');


			const channel_exists = await this.prisma.channel.findUnique
			({
				where:
				{
					Name: words[1],
				},
			});
			
			if (!channel_exists)
			{
				if (words.length != 4)
				{
					this.server.to(this_user.socketId).emit('onMessage',
					{
						user: "Server",
						message: "Wrong format for new Channel. To create a channel with password:",
					});
					this.server.to(this_user.socketId).emit('onMessage',
					{
						user: "Server",
						message: "/join [ServerName] password:[yourpassword] [public / private]",
					});
					this.server.to(this_user.socketId).emit('onMessage',
					{
						user: "Server",
						message: "or withour password",
					});
					this.server.to(this_user.socketId).emit('onMessage',
					{
						user: "Server",
						message: "/join [ServerName] noPassword [public / private]",
					});
				}
				else
				{
					// Crear el channel cno la password
					var pass_passed = 0;

					if (words[2].startsWith("password:") == true)
					{
						pass_passed = 1;

						const parts = words[2].split(":");
						console.log(words[1]);
						console.log(parts[1]);
						const channel8 = await this.prisma.channel.create
						({
							data:
							{
								Name: words[1],
								Password: parts[1],
							},
						});
					}
					else if (words[2] === ("noPassword"))
					{
						pass_passed = 1;

						const channel8 = await this.prisma.channel.create
						({
							data:
							{
								Name: words[1],
								Password: "",
							},
						});
					}
					else
					{
						this.server.to(this_user.socketId).emit('onMessage',
						{
							user: "Server",
							message: "Wrong format for new Channel. To create a channel with password:",
						});
						this.server.to(this_user.socketId).emit('onMessage',
						{
							user: "Server",
							message: "/join [ServerName] password:[yourpassword] [public / private]",
						});
						this.server.to(this_user.socketId).emit('onMessage',
						{
							user: "Server",
							message: "or withour password",
						});
						this.server.to(this_user.socketId).emit('onMessage',
						{
							user: "Server",
							message: "/join [ServerName] noPassword [public / private]",
						});
					}
					if (words[3] === ("private"))
					{
						const channel8 = await this.prisma.channel.findFirst
						({
							where:
							{
								Name: words[1],
							},
						});
						if (channel8)
							channel8.isPrivate = true;
					}
					else if (words[3] === ("public"))
					{
						const channel8 = await this.prisma.channel.findFirst
						({
							where:
							{
								Name: words[1],
							},
						});
						if (channel8)
							channel8.isPrivate = false;
					}
					if (pass_passed == 1)
					{
						const joined_channel_table = await this.prisma.joinedChannels.create
						({
							data:
							{
								idUser: body.userName,
								idChannel: words[1],
							},
						});
					}
				}
			}

			// 			 _____     Se une. Crea joinedChannels       _____

			if (channel_exists)
			{
				const channel = await this.prisma.channel.findUnique
				({
					where:
					{
						Name: words[1],
					},
				});
				console.log("Terreros");
				if (channel.Password === words[2] || channel.Password === "")
				{
					console.log("Riera");
					const joined_channel_table = await this.prisma.joinedChannels.create
					({
						data:
						{
							idUser: body.userName,
							idChannel: words[1],
						},
					});
				}
				else
				{
					this.server.to(this_user.socketId).emit('onMessage',
					{
						user: "Server",
						message: "Wrong password",
					});
				}
			}
		}
	}
	
	
	

	



	/*
	**		_________________________     ft_leave     _________________________
	*/
	
	//This might not work, retest

	async  ft_leave(body: any)
	{

		// 			 _____     Ver si el usuario está en un canal o no     _____

		const isUserinJoinedChannel = await this.prisma.joinedChannels.findUnique
		({
			where:
			{
				idUser: body.userName,
			},
		});
 

		// 			 _____     Si no está en ningún canal, busco el canal en el que está, guardo su nombre, le quito del canal, encuentro si hay más gente en ese canal y si no hay nadie más lo borro      _____

		if (isUserinJoinedChannel)
		{
			const whichChannelUserIsIn = await this.prisma.joinedChannels.findFirst
			({
				where:
				{
					idUser: body.userName,
				},
			})

			const channelName: string = whichChannelUserIsIn.idChannel;
			const deleteUser = await this.prisma.joinedChannels.delete
			({
				where:
				{
					idUser: body.userName,
				},
			})
			const allElements = await this.prisma.joinedChannels.findMany
			({
				where:
				{
					idChannel: channelName,
				},
			});
			if (allElements.length === 0)
			{
				const whichChannel = await this.prisma.channel.delete
				({
					where:
					{
						Name: channelName,
					},
				})

				console.log(channelName);
			}
			else
			{
				for (const uno of allElements)
				{
					console.log(uno.idChannel);
					console.log(uno.idUser);
				}
			}
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

	/*
	**		_________________________     gameChanges     _________________________
	*/

	@SubscribeMessage('keymapChanges')
	onKeymapChanges(@MessageBody() key: {key: string, keyStatus: boolean})
	{
		if (key.keyStatus == true)
			keysPressed[key.key] = true;
		else
			keysPressed[key.key] = false;
	}

	async gameLoop()
	{
		let direccion = Math.floor(Math.random() * 1);

		if (direccion)
			pos.ball_ang = Math.PI;
		else
			pos.ball_ang = 0;
			this.playerMove();
		setInterval(() => {this.playerMove()}, 4)
		setInterval(() => {pos.ball_ang = this.hitboxCheck(pos);}, 4)
		setInterval(() =>
		{
			let bounce : number | null;
			pos.ball_x += Math.cos(pos.ball_ang) * 3;
			pos.ball_y += Math.sin(pos.ball_ang) * -3;
			
			if (pos.ball_x < 0 || pos.ball_x > 1280)
			{
				if (pos.ball_x < 0)
					pos.player1_p += 1;
				if (pos.ball_x > 1280)
					pos.player2_p += 1;
				if (pos.player1_p > 9 || pos.player2_p > 9)
				{
					pos.player1_p = 0;
					pos.player2_p = 0;
				}
				let direccion2 = Math.floor(Math.random() * 2);

				if (direccion2 == 1)
					pos.ball_ang = Math.PI;
				else
					pos.ball_ang = 0;
				pos.ball_x = 628;
				pos.ball_y = 430;
				pos.player1_y = 405;
				pos.player2_y = 405;
			}
			if (pos.ball_x < 0 || pos.ball_x > 1275)
				pos.ball_inc *= -1;
			this.server.emit('gameChanges', pos);
		}, 16);
	}

	hitboxCheck(data: any): number
	{
		if (((data.ball_x + 10) > data.player1_x && (data.ball_x + 10) < data.player1_x + 15) 
			&& ((data.ball_y + 10) > data.player1_y && (data.ball_y + 10) < data.player1_y + 70))
		{
			if (((data.player1_y - (data.ball_y + 10)) * -1) <= 20)
				return Math.PI * 0.25;
			if (((data.player1_y - (data.ball_y + 10)) * -1) > 20 && ((data.player1_y - (data.ball_y + 10)) * -1) <= 50)
				return Math.PI * 2;
			if (((data.player1_y - (data.ball_y + 10)) * -1) > 50)
				return Math.PI * 1.75;
		}
		if (((data.ball_x + 10) > data.player2_x && (data.ball_x + 10) < data.player2_x + 15) 
			&& ((data.ball_y + 10) > data.player2_y && (data.ball_y + 10) < data.player2_y + 70))
		{
			if (((data.player2_y - (data.ball_y + 10)) * -1) <= 20)
				return Math.PI * 0.75;
			if (((data.player2_y - (data.ball_y + 10)) * -1) > 20 && ((data.player2_y - (data.ball_y + 10)) * -1) <= 50)
				return Math.PI;
			if (((data.player2_y - (data.ball_y + 10)) * -1) > 50)
				return Math.PI * 1.25;
		}
		if ((data.ball_y + 10) < 0 && data.ball_ang == (Math.PI * 0.25))
			return Math.PI * 1.75;
		else if ((data.ball_y + 10) < 0 && data.ball_ang == (Math.PI * 0.75))
			return Math.PI * 1.25;
		else if ((data.ball_y + 10) > 960 && data.ball_ang == (Math.PI * 1.75))
			return Math.PI * 0.25;
		else if ((data.ball_y + 10) > 960 && data.ball_ang == (Math.PI * 1.25))
			return Math.PI * 0.75;
		return data.ball_ang;
	}

	playerMove()
	{
		if (keysPressed["w"])
		{
			pos.player1_y -= 1;
			if (pos.player1_y < 0)
				pos.player1_y = 0;
		}
		if (keysPressed["s"])
		{
			pos.player1_y += 1;
			if (pos.player1_y > 890)
				pos.player1_y = 890;
		}
		if (keysPressed["ArrowUp"])
		{
			pos.player2_y -= 1;
			if (pos.player2_y < 0)
				pos.player2_y = 0;
		}
		if (keysPressed["ArrowDown"])
		{
			pos.player2_y += 1;
			if (pos.player2_y > 890)
				pos.player2_y = 890;
		}
		this.server.emit('gameChanges', pos);
	}
}