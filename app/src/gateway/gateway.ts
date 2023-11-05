import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClient, Prisma } from '@prisma/client'
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config'

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
	iv = randomBytes(16);

	constructor( private prisma: PrismaService,	private config: ConfigService)
	{
		this.gameLoop();			
	}
	@WebSocketServer()
	server: Server;


	async encryptPassword(textToEncrypt: string) : Promise<Buffer>
	{
		if (textToEncrypt == "")
			return null;

		// The key length is dependent on the algorithm.
		// In this case for aes256, it is 32 bytes.
		const key = (await promisify(scrypt)(this.config.get('PASSWORD_FOR_KEY_GEN'), 'salt', 32)) as Buffer;

		const cipher = createCipheriv('aes-256-ctr', key, this.iv);

		const encryptedText = Buffer.concat([
			cipher.update(textToEncrypt),
			cipher.final(),
		]);

		return encryptedText;
	}

	async decryptPassword(encryptedText: any) : Promise<string>
	{	
		if (encryptedText == null)
			return "";

		// The key length is dependent on the algorithm.
		// In this case for aes256, it is 32 bytes.
		const key = (await promisify(scrypt)(this.config.get('PASSWORD_FOR_KEY_GEN'), 'salt', 32)) as Buffer;

		const decipher = createDecipheriv('aes-256-ctr', key, this.iv);
		const decryptedText = Buffer.concat([
			decipher.update(encryptedText),
			decipher.final(),
		]);

		return decryptedText.toString();
	}

	/*
	**		___________________     Get Socket at start     ___________________
	*/

	onModuleInit()
	{
		this.server.on('connection', (socket) =>
		{
			this.server.to(socket.id).emit('InitSocketId', socket.id);
			console.log("Entra + " + socket.id);
		
			socket.on('disconnect', () =>
			{
				console.log("A user disconnected: " + socket.id);
				// this.ft_offline(socket.id);
				
			});
		});
		
	}

	async ft_offline(id: string)
	{
		const user = await this.prisma.user.findFirst
		({
			where:
			{
				socketId: id,
			},
		});

		await this.prisma.user.update
		({
			where:
			{
				login_42: user.login_42,
			},
			data:
			{
				status: "offline",
			},
		});
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
		const words = body.message.split(' ');
		
		//              ______     DMs     ______
		
		if (words[0] == "/dm")
		{
			this.ft_dm(body);
		}
		else if (words[0] == "/block")
		{
			this.ft_block(body);
		}
		else if (words[0] == "/unblock")
		{
			this.ft_unblock(body);
		}
		else if (words[0] == "/friends")
		{
			this.ft_friends(body);
		}
		else if (words[0] == "/showprofile")
		{
			this.ft_showprofile(body);
		}

		//              ______     Channels     ______

		else if (words[0] == "/join")
		{
			this.ft_join(body);
		}
		else if (words[0] == "/leave")
		{
			this.ft_leave(body);
		}
		else if (words[0] == "/list")
		{
			this.ft_list(body);
		}
		

		//              ______     Admin commands     ______

		else if (words[0] == "/kick")
		{
			this.ft_kick(body);
		}
		else if (words[0] == "/ban")
		{
			this.ft_ban(body);
		}
		else if (words[0] == "/mute")
		{
			this.ft_mute(body);
		}
		else if (words[0] == "/giveAdmin")
		{
			this.ft_giveAdmin(body);
		}
		else if (words[0] == "/changePassword")
		{
			this.ft_changePassword(body);
		}
		else if (words[0] == "/kick")
		{
			this.ft_kick(body);
		}


		//              ______     Game Commands     ______

		else if (words[0] == "/listMatches")
		{
			this.ft_listMatches(body);
		}
		else if (words[0] == "/Spectate")
		{
			this.ft_spectate(body);
		}
		else
		{
			this.ft_send(body);
		}

	}






	















	/*
	**		_________________________     ft_dm     _________________________
	*/

	async ft_dm(body: any)
	{

		//              ______     divide las palabras     ______

		const words = body.message.split(' ');

		if (words.length >= 3)
		{
			const actual_message = words.slice(2).join(' ');

			const user = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: String(words[1]),
				},
			});

			if (user)
			{
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

				const USERNICKNAME = await this.prisma.user.findUnique
				({
					where:
					{
						login_42: body.userName,
					},
				});

				if (user && USERNICKNAME && !isBlocked && !urBlocked)
				{
					this.server.to(user.socketId).emit('onMessage',
					{
		//				user: body.userName,
						user: USERNICKNAME.nickname,

						message: "[private] " + actual_message,
					});
				}
			}
		}
		else
			this.ft_error(body, "/dm [User] [message]");
	}




















	/*
	**		_______________________     ft_block     _______________________
	*/

	async ft_block(body: any)
	{
		//              ______     buscar persona a bloquear     ______

		const words = body.message.split(' ');

		if (words.length == 2)
		{
			const user2block = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: String(words[1]),
				},
			});

			const blockNoExist = await this.prisma.blockedUsers.findFirst
			({
				where:
				{
					userBlocker: body.userName,
					userBlocked: words[1],
				},
			});


			//              ______     Meterla en la tabla de blocks     ______

			if (user2block && user2block.login_42 != body.userName && !blockNoExist)
			{
				await this.prisma.blockedUsers.create
				({
					data:
					{
						userBlocker: body.userName,
						userBlocked: words[1],
					},
				});
			}
		}
		else
			this.ft_error(body, "/block [User]");
	}




















	/*
	**		_______________________     ft_unblock     _______________________
	*/

	async ft_unblock(body: any)
	{
		//              ______     buscar persona a bloquear     ______

		const words = body.message.split(' ');

		if (words.length == 2)
		{
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

				const blockCard = await this.prisma.blockedUsers.delete
				({
					where:
					{
						id: toUnBlockTable.id,
					},
				});
			}
		}
		else
			this.ft_error(body, "/unblock [User]");
	}




















	/*
	**		_______________________     ft_friends     _______________________
	*/

	async ft_friends(body: any)
	{
		//              ______     buscar tu persona     ______

		const my_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});


		//              ______  Mostrar tus friends cuando eres 1   ______

		const all_friends_when_I_am_User_1 = await this.prisma.friends.findMany
		({
			where:
			{
				idUser1: my_user.id,
			},
		});

		const all_friends_when_I_am_User_2 = await this.prisma.friends.findMany
		({
			where:
			{
				idUser2: my_user.id,
			},
		});
		
		this.server.to(my_user.socketId).emit('onMessage',
		{
			user: "",
			message: "Friends:",
		});

		for (const each_friend of all_friends_when_I_am_User_1)
		{
			const user2 = await this.prisma.user.findUnique
			({
				where:
				{
					id: each_friend.idUser2,
				},
			});

			this.server.to(my_user.socketId).emit('onMessage',
			{
				user: "",
				message: ("-   " + user2.login_42 + " [ " + user2.status +  " ]" ),
			});
		}

		for (const each_friend of all_friends_when_I_am_User_2)
		{
			const user1 = await this.prisma.user.findUnique
			({
				where:
				{
					id: each_friend.idUser1,
				},
			});

			this.server.to(my_user.socketId).emit('onMessage',
			{
				user: "",
				message: ("-   " + user1.login_42 + " [ " + user1.status +  " ]" ),
			});
		}
	}





















	/*
	**		_______________________     ft_showprofile     _______________________
	*/

	async ft_showprofile(body: any)
	{
		const words = body.message.split(' ');

		const my_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (words.length == 2)
		{
			const user_to_send = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: words[1],
				},
			});

			if (user_to_send)
			{
				this.server.to(my_user.socketId).emit('onMessage',
				{
					user: body.userName,
					other: 
					{
						command: "Friend",
						friend: words[1]
					},
				});
			}
		}
		else
			this.ft_error(body, "/showprofile [User]");
	}




















	/*
	**		_________________________     ft_join     _________________________
	*/
	
	async ft_join(body: any)
	{
		const words = body.message.split(' ');

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
				message: "You are alredy in a channel.",
			});
		}


		if (!is_on_channel_alredy && words[1])
		{
			//              ______     Busca  canales     ______

			const channel_exists = await this.prisma.channel.findFirst
			({
				where:
				{
					Name: words[1],
				},
			});
			

			//              ______     Si está baneado     ______


			const banned_channel_exists = await this.prisma.usersBannedChannel.findFirst
			({
				where:
				{
					idUser: this_user.login_42,
					idChannel: words[1],
					
				},
			});

			if (banned_channel_exists)
			{
				this.server.to(this_user.socketId).emit('onMessage',
				{
					user: "Server",
					message: "You are banned from this server.",
				});
			}


			//              ______     Si está muteado     ______

			const muted_channel_exists = await this.prisma.userMutedChannel.findFirst
			({
				where:
				{
					idUser: this_user.login_42,
					idChannel: words[1],
				},
			});

			var isAllowedIn = true;

			if (muted_channel_exists)
			{
				const dateNow: Date = new Date();

				if (dateNow >= muted_channel_exists.dateAllowedIn)
				{
					isAllowedIn = true;
					this.server.to(this_user.socketId).emit('onMessage',
					{
						user: "Server",
						message: "You were muted, but now, you are allowed in. Rejoice.",
					});
					const deleteUser = await this.prisma.userMutedChannel.deleteMany
					({
						where:
						{
							idUser: body.userName,
							idChannel: words[1],
						},
					})
				}
				else
				{
					isAllowedIn = false;
					this.server.to(this_user.socketId).emit('onMessage',
					{
						user: "Server",
						message: "You are muted from this channel. Patience.",
					});
				}
			}
			




			//              ______     CREA el canal si no existe     ______

			if (!channel_exists)
			{
				if (words.length != 4)
				{
					this.ft_error_create_channel(body);
				}
				else
				{
					// Crear el channel cno la password
					var pass_passed = 0;

					//              ______     Crea el channel dependiendo si tiene password     ______

					if (words[2].startsWith("password:") == true)
					{
						pass_passed = 1;

						const parts = words[2].split(":");
						
						const encryptedPassword = await this.encryptPassword(parts[1]);
						const channel8 = await this.prisma.channel.create
						({
							data:
							{
								Name: words[1],
								Password: encryptedPassword,
							},
						});
					}
					else if (words[2] == ("noPassword"))
					{
						pass_passed = 1;

						const channel8 = await this.prisma.channel.create
						({
							data:
							{
								Name: words[1],
								Password: Buffer.from([])
							},
						});
					}
					else
					{
						this.ft_error_create_channel(body);
					}




					//              ______     Update la vairable de privado     ______

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
						{
							await this.prisma.channel.update
							({
								where:
								{
									Name: words[1],
								},
								data:
								{
									isPrivate: true,
								},
							});
						}
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
						{
							await this.prisma.channel.update
							({
								where:
								{
									Name: words[1],
								},
								data:
								{
									isPrivate: false,
								},
							});
						}
					}
					else
					{
						this.ft_error_create_channel(body);
					}




					//              ______     Si todo va bien, crea la tabla     ______

					if (pass_passed == 1)
					{

						const this_user = await this.prisma.user.findUnique
						({
							where:
							{
								login_42: body.userName,
							},
						});

						await this.prisma.user.update
						({
							where:
							{
								id: this_user.id
							},
							data:
							{
								channelRol: String("owner"),
							},
						});
						
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

			if (channel_exists && !banned_channel_exists && isAllowedIn)
			{
				const channel = await this.prisma.channel.findUnique
				({
					where:
					{
						Name: words[1],
					},
				});

				const decryptedChannelPassword = await this.decryptPassword(channel.Password);

				if (decryptedChannelPassword === words[2] || decryptedChannelPassword == "")
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
		else if (!words[1])
		{
			this.ft_error_create_channel(body);
		}
	}




	async ft_error_create_channel(body: any)
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
			message: "Wrong format for new Channel:",
		});

		this.server.to(this_user.socketId).emit('onMessage',
		{
			user: "Server",
			message: "/join [ChannelName] password:[urPass] [public / private]",
		});

		this.server.to(this_user.socketId).emit('onMessage',
		{
			user: "Server",
			message: "/join [ChannelName] noPassword [public / private]",
		});
	}




















	/*
	**		_________________________     ft_leave     _________________________
	*/
	
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
			
			await this.prisma.user.update
			({
				where:
				{
					login_42: body.userName
				},
				data:
				{
					channelRol: String("user"),
				},
			});

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
				// 			 _____     borrar todos los baneados también     _____

				const deleteMuted = await this.prisma.userMutedChannel.deleteMany
				({
					where:
					{
						idChannel: channelName,
					},
				})

				const deleteBanned = await this.prisma.usersBannedChannel.deleteMany
				({
					where:
					{
						idChannel: channelName,
					},
				})

				const whichChannel = await this.prisma.channel.delete
				({
					where:
					{
						Name: channelName,
					},
				})
			}
		}
		else
			this.ft_error(body, "You are not in a channel");
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
				isPrivate: false,
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
	**		_______________________     ft_kick     _______________________
	*/


	async ft_kick(body: any)
	{
		const words = body.message.split(' ');


		//              ______     Get users     ______

		if (words.length == 2)
		{
			const this_user = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: body.userName,
				},
			});

			const to_kick_user = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: words[1],
				},
			});


			//              ______     Get joinedChannels     ______


			const JoinedChannels_this_user = await this.prisma.joinedChannels.findFirst
			({
				where:
				{
					idUser: words[1],
				},
			});

			const JoinedChannels_user_to_kick = await this.prisma.joinedChannels.findFirst
			({
				where:
				{
					idUser: body.userName,
				},
			});

			//              ______     kick     ______


			if (JoinedChannels_this_user && JoinedChannels_user_to_kick && 
				(this_user.channelRol == "owner" || (this_user.channelRol == "admin" && to_kick_user.channelRol == 'user')) && JoinedChannels_this_user.idChannel == JoinedChannels_user_to_kick.idChannel
				&& this_user.login_42 != to_kick_user.login_42)
			{
				const deleteJoinedChannel = await this.prisma.joinedChannels.delete
				({
					where:
					{
						idUser: words[1],
					},
				})

				this.server.to(this_user.socketId).emit('onMessage',
				{
					user: "Server",
					message: "You kicked " + words[1],
				});

				this.server.to(to_kick_user.socketId).emit('onMessage',
				{
					user: "Server",
					message: "You were kicked by " + this_user.login_42,
				});
			}
		}
		else
			this.ft_error(body, "/kick [user]");
	}




















	/*
	**		_______________________     ft_ban     _______________________
	*/

	async ft_ban(body: any)
	{
		const words = body.message.split(' ');

		
		//              ______     Get users     ______
	
		if (words.length == 2)
		{
			const this_user = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: body.userName,
				},
			});

			const to_kick_user = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: words[1],
				},
			});


			//              ______     Get joinedChannels     ______

			if (this_user && to_kick_user)
			{
				const JoinedChannels_this_user = await this.prisma.joinedChannels.findFirst
				({
					where:
					{
						idUser: words[1],
					},
				});

				const JoinedChannels_user_to_ban = await this.prisma.joinedChannels.findFirst
				({
					where:
					{
						idUser: body.userName,
					},
				});


				//              ______     Ban     ______

				if (JoinedChannels_this_user && JoinedChannels_user_to_ban && 
					(this_user.channelRol == "owner" || (this_user.channelRol == "admin" && to_kick_user.channelRol == 'user')) && JoinedChannels_this_user.idChannel == JoinedChannels_user_to_ban.idChannel
					&& this_user.login_42 != to_kick_user.login_42)
				{


					//              ______     Delete JoinedChannels table      ______

					const deleteJoinedChannel = await this.prisma.joinedChannels.delete
					({
						where:
						{
							idUser: words[1],
						},
					})


					//              ______     Create banned table      ______

					const HasBeenBanned = await this.prisma.usersBannedChannel.findFirst
					({
						where:
						{
							idUser: words[1],
							idChannel: JoinedChannels_this_user.idChannel,
						},
					});
					
					if (!HasBeenBanned)
					{
						const UserBanned = await this.prisma.usersBannedChannel.create
						({
							data:
							{
								idUser: words[1],
								idChannel: JoinedChannels_this_user.idChannel,
							},
						});
					}
						

					//              ______     Send Decorative Message      ______

					this.server.to(this_user.socketId).emit('onMessage',
					{
						user: "Server",
						message: "You banned " + words[1],
					});

					this.server.to(to_kick_user.socketId).emit('onMessage',
					{
						user: "Server",
						message: "You were banned by " + this_user.login_42,
					});

				}
			}
		}
		else
			this.ft_error(body, "/ban [user]");
	}





















	/*
	**		_______________________     ft_mute     _______________________
	*/


	async ft_mute(body: any)
	{
		const words = body.message.split(' ');

		
		//              ______     Get users     ______

		if (words.length == 3)
		{
			if (/^\d+$/.test(words[2]))
			{
				const this_user = await this.prisma.user.findUnique
				({
					where:
					{
						login_42: body.userName,
					},
				});
				
				const to_kick_user = await this.prisma.user.findUnique
				({
					where:
					{
						login_42: words[1],
					},
				});
				
				
				//              ______     Get joinedChannels     ______
				
				if (this_user && to_kick_user)
				{
					const JoinedChannels_this_user = await this.prisma.joinedChannels.findFirst
					({
						where:
						{
							idUser: words[1],
						},
					});
	
					const JoinedChannels_user_to_ban = await this.prisma.joinedChannels.findFirst
					({
						where:
						{
							idUser: body.userName,
						},
					});
	
	
					//              ______     Mute     ______
	
					if (JoinedChannels_this_user && JoinedChannels_user_to_ban && 
						(this_user.channelRol == "owner" || (this_user.channelRol == "admin" && to_kick_user.channelRol == 'user')) && JoinedChannels_this_user.idChannel == JoinedChannels_user_to_ban.idChannel
						&& this_user.login_42 != to_kick_user.login_42)
					{
	
						//              ______     Delete JoinedChannels table      ______
	
						const deleteJoinedChannel = await this.prisma.joinedChannels.delete
						({
							where:
							{
								idUser: words[1],
							},
						})
	
	
						//              ______     Create muted banned table      ______
						
						const ReleaseDate: Date = new Date();
						ReleaseDate.setSeconds(ReleaseDate.getSeconds() + parseInt(words[2]));
	
						const UserBanned = await this.prisma.userMutedChannel.create
						({
							data:
							{
								idUser: words[1],
								idChannel: JoinedChannels_this_user.idChannel,
								dateAllowedIn: ReleaseDate,
							},
						});
	
						//              ______     Send Decorative Message      ______
	
						this.server.to(this_user.socketId).emit('onMessage',
						{
							user: "Server",
							message: "You muted " + words[1] + " for " + words[2] + " seconds.",
						});
	
						this.server.to(to_kick_user.socketId).emit('onMessage',
						{
							user: "Server",
							message: "You were muted by " + this_user.login_42 + " for " + words[2] + " seconds.",
						});
	
					}
				}
			}
		}
		else
			this.ft_error(body, "/mute [user] [time]");
	}




















	/*
	**		_______________________     ft_giveAdmin     _______________________
	*/


	async ft_giveAdmin(body: any)
	{
		const words = body.message.split(' ');


		//              ______     Get users     ______

		if (words.length == 2)
		{
			const this_user = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: body.userName,
				},
			});

			const to_admin_user = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: words[1],
				},
			});


			//              ______     Get joinedChannels     ______

			if (this_user && to_admin_user)
			{
				const JoinedChannels_this_user = await this.prisma.joinedChannels.findFirst
				({
					where:
					{
						idUser: words[1],
					},
				});

				const JoinedChannels_to_admin_user = await this.prisma.joinedChannels.findFirst
				({
					where:
					{
						idUser: body.userName,
					},
				});


				//              ______     Give Admin     ______

				if (JoinedChannels_this_user && JoinedChannels_to_admin_user && 
					(this_user.channelRol == "owner") && JoinedChannels_this_user.idChannel == JoinedChannels_to_admin_user.idChannel
					&& this_user.login_42 != to_admin_user.login_42)
				{

					await this.prisma.user.update
					({
						where:
						{
							login_42: to_admin_user.login_42,
						},
						data:
						{
							channelRol: String("admin"),
						},
					});
		
					

					//              ______     Send Decorative Message      ______

					this.server.to(this_user.socketId).emit('onMessage',
					{
						user: "Server",
						message: "You made " + words[1] + " admin.",
					});

					this.server.to(to_admin_user.socketId).emit('onMessage',
					{
						user: "Server",
						message: "You were made admin by " + this_user.login_42 + ". Congratulations!",
					});
				}
			}
		}
		else
			this.ft_error(body, "/giveAdmin [User]");
	}



















	/*
	**		_________________________     ft_changePassword     _________________________
	*/

	async ft_changePassword(body: any)
	{
		const words = body.message.split(' ');


		//              ______     Get users     ______
		
		if (words.length == 2)
		{
			const this_user = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: body.userName,
				},
			});


			//              ______     Get joinedChannels     ______

			const JoinedChannels_this_user = await this.prisma.joinedChannels.findFirst
			({
				where:
				{
					idUser: this_user.login_42,
				},
			});


			//              ______     update pass     ______

			const encryptedPassword = await this.encryptPassword(words[1]);

			if (JoinedChannels_this_user && (this_user.channelRol == "owner"))
			{
				await this.prisma.channel.update
				({
					where:
					{
						Name: JoinedChannels_this_user.idChannel
					},
					data:
					{
						Password: encryptedPassword,
					},
				});

				this.server.to(this_user.socketId).emit('onMessage',
				{
					user: "Server",
					message: "You changed the Password",
				});
			}
		}
		else
			this.ft_error(body, "/changePassword [User]");
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

					const USERNICKNAME = await this.prisma.user.findUnique
					({
						where:
						{
							login_42: body.userName,
						},
					});

					if (user_to_find && USERNICKNAME)
					{
						this.server.to(user_to_find.socketId).emit('onMessage',
						{
							user: USERNICKNAME.nickname,
							// user: body.userName,
							message: "[" + channel_user.idChannel + "] "  + body.message,
						});
					}
				}
			}
		}
		else
			this.ft_error(body, "You are not in a channel");
	}




















	/*
	**		_________________________     ft_listMatches     _________________________
	*/

	async ft_listMatches(body: any)
	{

		const words = body.message.split(' ');

		//              ______     buscar tu persona     ______

		if (words.length == 1)
		{
			const my_user = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: body.userName,
				},
			});

			const all_matches_playing = await this.prisma.gameRooms.findMany
			({
				where:
				{
					waiting: false,
				},
			});


			//              ______     Poner los matches     ______

			this.server.to(my_user.socketId).emit('onMessage',
			{
				user: "",
				message: "Game Rooms:",
			});

			for (const room of all_matches_playing)
			{
				this.server.to(my_user.socketId).emit('onMessage',
				{
					user: "",
					message: ("-   ID : [" + room.id + "]" ),
				});
			}
		}
		else
			this.ft_error(body, "/listMatches");
	}
















	/*
	**		_________________________     ft_spectate     _________________________
	*/

	async ft_spectate(body: any)
	{


	}






	async ft_error(body: any, err: String)
	{
		const my_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		this.server.to(my_user.socketId).emit('onMessage',
		{
			user: "Server",
			message: err,
		});
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
	}
}