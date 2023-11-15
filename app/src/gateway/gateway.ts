import { OnModuleInit } from '@nestjs/common';
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket} from 'socket.io';
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClient, Prisma } from '@prisma/client'
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config'
import { map } from 'rxjs';
import { UserService } from 'src/user/user.service';

var gameRooms: Map<string, gameRoom> = new Map<string, gameRoom>();

@WebSocketGateway({cors: {origin: '*'}})
export class MyGateway
{
	iv = randomBytes(16);

	constructor( private prisma: PrismaService,	private config: ConfigService)
	{
	}
	@WebSocketServer()
	server: Server;

	/*
	**		___________________     Connection     ___________________
	*/

	onModuleInit()
	{
		this.server.on('connection', (socket) =>
		{
			this.server.to(socket.id).emit('InitSocketId', socket.id);
		});
	}
	
	/*
	**		___________________     Events    ___________________
	*/

	@SubscribeMessage('newUserAndSocketId')
	onNewUserAndSocketId(@MessageBody() body: any, @ConnectedSocket() socket: Socket)
	{
		this.ft_new_user_connection(body.userName, socket.id);

		socket.on('disconnect', () =>
		{
			this.ft_offline(body.userName);
		});
	}

	@SubscribeMessage('enterRoom')
	onEnterRoom(@MessageBody() body: any, @ConnectedSocket() socket: Socket)
	{
		const user_id : number = body.user_id;
		const roomName : string = body.room_id.toString();

		socket.join(roomName);

		if (!gameRooms[roomName])
		{
			const gameMode : boolean = body?.gameMode;
			gameRooms[roomName] = new gameRoom(roomName, this.server, socket, user_id, gameMode, this);

			this.server.to(socket.id).emit('onMessage',
			{
				user: "SERVER",
				message: "Te has conectado a la sala " + roomName,
			});
		}
		else if (gameRooms[roomName].idPlayer1 == user_id)
			gameRooms[roomName].socket1 = socket;
		else if (gameRooms[roomName].idPlayer2 == user_id)
			gameRooms[roomName].socket2 = socket;
		else if (gameRooms[roomName].getStatus() == false)
			gameRooms[roomName].gameLoop(socket, user_id);
	}

	@SubscribeMessage('newMessage')
	onNewMessage(@MessageBody() body: any, @ConnectedSocket() socket: Socket)
	{
		const msg: string = String(body.message);
		const words = body.message.split(' ');
		
		if (words[0] == "/dm")
			this.ft_dm(body, socket);
		else if (words[0] == "/block")
			this.ft_block(body, socket);
		else if (words[0] == "/unblock")
			this.ft_unblock(body, socket);
		else if (words[0] == "/friends")
			this.ft_friends(body, socket);
		else if (words[0] == "/showProfile")
			this.ft_showProfile(body, socket);

		//              ______     Channels     ______
		else if (words[0] == "/join")
			this.ft_join(body, socket);
		else if (words[0] == "/leave")
			this.ft_leave(body, socket);
		else if (words[0] == "/list")
			this.ft_list(body, socket);

		//              ______     Admin commands     ______
		else if (words[0] == "/kick")
			this.ft_kick(body, socket);
		else if (words[0] == "/ban")
			this.ft_ban(body, socket);
		else if (words[0] == "/mute")
			this.ft_mute(body, socket);
		else if (words[0] == "/giveAdmin")
			this.ft_giveAdmin(body, socket);
		else if (words[0] == "/changePassword")
			this.ft_changePassword(body, socket);

		//              ______     Game Commands     ______
		else if (words[0] == "/listMatches")
			this.ft_listMatches(body, socket);
		else if (words[0] == "/spectate")
			this.ft_spectate(body, socket);
		else if (words[0] == "/challenge")
			this.ft_challenge(body, socket);
		else if (words[0] == "/help")
			this.ft_help(body, socket);
		else if (words[0] == "/rules")
			this.ft_rules(body, socket);
		else
			this.ft_send(body, socket);
	}

	@SubscribeMessage('newAdminMessage')
	onNewAdminMessage(@MessageBody() body: any, @ConnectedSocket() socket: Socket)
	{
		const msg: string = String(body.message);
		const words = body.message.split(' ');
		
		if (words[0] == "/deleteChannel")
			this.ft_admin_delete_channel(body, socket);
		else if (words[0] == "/banFromWeb")
			this.ft_admin_ban(body, socket);
		else if (words[0] == "/listAllChannels")
			this.ft_admin_list(body, socket);
		else if (words[0] == "/giveMod")
			this.ft_admin_give_mod(body, socket);
		else if (words[0] == "/removeMod")
			this.ft_admin_remove_mod(body, socket);
		else if (words[0] == "/help")
			this.ft_admin_help(body, socket);
		else if  (words[0] == "/giveChannelAdmin")
			this.ft_admin_giveChannelAdmin(body, socket);
		else if  (words[0] == "/revokeChannelAdmin")
			this.ft_admin_revokeChannelAdmin(body, socket);
		else
			this.ft_admin_send(body, socket);
	}

	@SubscribeMessage('keymapChanges')
	onKeymapChanges(@MessageBody() key: {key: string, keyStatus: boolean, room_id: string, player_id: number})
	{
		if (gameRooms[key.room_id]?.idPlayer1 == key.player_id)
		{
			if (key.keyStatus == true)
				gameRooms[key.room_id].keysPressed1[key.key] = true;
			else
				gameRooms[key.room_id].keysPressed1[key.key] = false;
		}
		if (gameRooms[key.room_id]?.idPlayer2 == key.player_id)
		{
			if (key.keyStatus == true)
				gameRooms[key.room_id].keysPressed2[key.key] = true;
			else
				gameRooms[key.room_id].keysPressed2[key.key] = false;
		}
		return;
	}

	/*
	**		___________________     More functions    ___________________
	*/
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

	async ft_new_user_connection(userName: string, p_socketId: string)
	{
		const user = await this.prisma.user.findUnique
		({
			where: 
			{
				login_42: userName
			}
		});
		
		if (!user)
			return;

		var status = "online";
		if (user.status == "In game")
			status = "In game";

		if (user.status == "online" && user.socketId != "")
			this.server.to(user.socketId).emit("expulsion");

		await this.prisma.user.update
		({
			where:
			{
				id: user.id
			},
			data:
			{
				socketId: p_socketId,
				status: status
			}
		});
	}

	async ft_offline(userName: string)
	{
		const user = await this.prisma.user.findFirst
		({
			where:
			{
				login_42: userName,
			}
		});

		if (!user)
			return;

		var status = "offline";
		if (user.status == "In game")
			status = "In game";

		await this.prisma.user.update
		({
			where:
			{
				login_42: user.login_42,
			},
			data:
			{
				socketId: "",
				status: status
			}
		});
	}

	async ft_dm(body: any, socket: Socket)
	{
		//              ______     divide las palabras     ______
		const words = body.message.split(' ');

		if (words.length < 3)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/dm [User] [message]"
			});
			return;
		}

		const actual_message = words.slice(2).join(' ');

		const dmTarget = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: String(words[1]),
			},
		});

		if (!dmTarget)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "User not found"
			});
			return;
		}

		const isBlocked = await this.prisma.blockedUsers.findFirst
		({
			where:
			{
				userBlocked: String(dmTarget.login_42),
				userBlocker: String(body.userName),
			},
		});

		if (isBlocked)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You have this user blocked"
			});
			return;
		}
		
		const urBlocked = await this.prisma.blockedUsers.findFirst
		({
			where:
			{
				userBlocked: String(body.userName),
				userBlocker: String(dmTarget.login_42),
			},
		});

		if (urBlocked)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "This user has blocked you"
			});
			return;
		}

		const sender = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (sender)
		{
			this.server.to(dmTarget.socketId).emit('onMessage',
			{
				user: sender.nickname,
				message: "[private] " + actual_message,
			});
		}
	}

	async ft_block(body: any, socket: Socket)
	{
		//              ______     buscar persona a bloquear     ______

		const words = body.message.split(' ');

		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/block [User]"
			});
			return;
		}

		const user2block = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: String(words[1]),
			},
		});

		if (!user2block)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "User not found"
			});
			return;
		}

		if (user2block.login_42 == body.userName)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You can't block yourself"
			});
			return;
		}

		const blockNoExist = await this.prisma.blockedUsers.findFirst
		({
			where:
			{
				userBlocker: body.userName,
				userBlocked: user2block.login_42,
			},
		});

		if (blockNoExist)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "User was already blocked"
			});
			return;
		}

		//              ______     Meterla en la tabla de blocks     ______

		await this.prisma.blockedUsers.create
		({
			data:
			{
				userBlocker: body.userName,
				userBlocked: user2block.login_42,
			},
		});
		
		this.server.to(socket.id).emit('onMessage', {
			user: 'Server',
			message: "User " + user2block.nickname + " successfully blocked"
		});
		return;
	}

	async ft_unblock(body: any, socket: Socket)
	{
		//              ______     buscar persona a bloquear     ______

		const words = body.message.split(' ');

		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/unblock [User]"
			});
			return;
		}

		const user2unblock = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: String(words[1]),
			},
		});

		if (!user2unblock)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "User not found"
			});
			return;
		}

		if (user2unblock.login_42 == body.userName)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You can't unblock yourself"
			});
			return;
		}

		//              ______     Meterla en la tabla de blocks     ______
		const toUnBlockTable = await this.prisma.blockedUsers.findFirst
		({
			where:
			{
				userBlocker: body.userName,
				userBlocked: user2unblock.login_42,
			}
		});

		if (!toUnBlockTable)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "User was not blocked"
			});
			return;
		}

		await this.prisma.blockedUsers.delete
		({
			where:
			{
				id: toUnBlockTable.id,
			}
		});

		this.server.to(socket.id).emit('onMessage', {
			user: 'Server',
			message: "User successfully unblocked"
		});
	}

	/*
	**		_______________________     ft_friends     _______________________
	*/

	async ft_friends(body: any, socket: Socket)
	{
		//              ______     buscar tu persona     ______

		const my_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (!my_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't exist, for some reason"
			});
			return;
		}


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
				message: ("-   " + user2.nickname + " [ " + user2.status +  " ]" ),
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
				message: ("-   " + user1.nickname + " [ " + user1.status +  " ]" ),
			});
		}
	}

	async ft_showProfile(body: any, socket: Socket)
	{
		const words = body.message.split(' ');

		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/showProfile [User]"
			});
			return;
		}

		const my_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (!my_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't exist, for some reason"
			});
			return;
		}

		const user_to_send = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: words[1],
			},
		});

		if (!user_to_send)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "User not found"
			})
			return;
		}

		this.server.to(my_user.socketId).emit('onMessage',
		{
			user: body.userName,
			other: 
			{
				command: "Friend",
				friend: user_to_send.login_42
			},
		});
	}

	async ft_join(body: any, socket: Socket)
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

		if (!this_user)
		{
			this.server.to(this_user.socketId).emit('onMessage',
			{
				user: "Server",
				message: "You don't exist, for some reason",
			});
			return;
		}

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
				message: "You are alredy on a channel.",
			});
			return;
		}


		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/join [ChannelName] [password:[urPass] / noPassword] [public / private]"
			});
			return;
		}

		//              ______     Busca  canales     ______
		const channel_exists = await this.prisma.channel.findFirst
		({
			where:
			{
				Name: words[1]
			}
		});

		//              ______     Si está baneado     ______
		const banned_channel_exists = await this.prisma.usersBannedChannel.findFirst
		({
			where:
			{
				idUser: this_user.login_42,
				idChannel: words[1]
			}
		});

		if (banned_channel_exists)
		{
			this.server.to(this_user.socketId).emit('onMessage',
			{
				user: "Server",
				message: "You are banned from this channel.",
			});
			return;
		}

		//              ______     CREA el canal si no existe     ______

		if (!channel_exists)
		{
			if (words.length < 4)
			{
				this.server.to(socket.id).emit('onMessage', {
					user: 'Server',
					message: "/join [ChannelName] [password:[urPass] / noPassword] [public / private]"
				})
			}
			else
			{
				// Crear el channel cno la password
				var pass_passed = 0;

				//              ______     Crea el channel dependiendo si tiene password     ______

				if (words[2].startsWith("password:") == true && (words[3] === ("private") || words[3] === ("public")))
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
				else if (words[2] == ("noPassword") && (words[3] === ("private") || words[3] === ("public")))
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
					this.server.to(socket.id).emit('onMessage', {
						user: 'Server',
						message: "/join [ChannelName] [password:[urPass] / noPassword] [public / private]"
					})
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
					this.server.to(socket.id).emit('onMessage', {
						user: 'Server',
						message: "/join [ChannelName] [password:[urPass] / noPassword] [public / private]"
					})
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

		if (channel_exists && !banned_channel_exists)
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
				this.server.to(socket.id).emit('onMessage',
				{
					user: "Server",
					message: "Wrong password",
				});
			}
		}
	}

	async ft_admin_delete_channel(body: any, socket: Socket)
	{
		const words = body.message.split(' ');
		
 		if (words.leng < 2)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "/deleteChannel [channelName]",
			});
			return;
		}

		const this_user = await this.prisma.user.findUnique({
			where: {
				login_42: body.userName,
			}
		});
        if (!this_user)
       {
           this.server.to(socket.id).emit('onAdminMessage',
           {
               user: "Server",
               message: "Your login not found"
           });
           return;
       }
       if (this_user.webRol == "user")
       {
           this.server.to(socket.id).emit('onAdminMessage',
           {
               user: "Server",
               message: "You don't have the privileges."
           });
           return;
       }

	
		const channel = await this.prisma.channel.findUnique
		({
			where:
			{
				Name: words[1]
			},
		});

		if (!channel)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "Channel not found.",
			});
			return;
		}

		await this.prisma.channel.delete
		({
			where:
			{
				id: channel.id
			},
		});

		const joinedUsers = await this.prisma.joinedChannels.findMany({
			where: {
				idChannel: channel.Name //Alex te odio por esto
			}
		});

		await this.prisma.joinedChannels.deleteMany({
			where: {
				idChannel: channel.Name
			}
		});

		for (const joinedUser of joinedUsers)
		{
			const user = await this.prisma.user.findUnique
			({
				where:
				{
					login_42: joinedUser.idUser // Y por esto también
				},
			});

			if (!user)
				continue;

			await this.prisma.user.update
			({
				where:
				{
					id: user.id // Y por esto también
				},
				data:
				{
					channelRol: "user"
				}
			});

			this.server.to(user.socketId).emit('onMessage',
			{
				user: "Server",
				message: "The channel has been closed.",
			});
		}

		await this.prisma.userMutedChannel.deleteMany({
			where: {
				idChannel: channel.Name
			}
		});

		await this.prisma.usersBannedChannel.deleteMany({
			where: {
				idChannel: channel.Name
			}
		});
	}

	
	async  ft_leave(body: any, socket: Socket)
	{

		// 			 _____     Ver si el usuario está en un canal o no     _____

		const userChannel = await this.prisma.joinedChannels.findUnique
		({
			where:
			{
				idUser: body.userName,
			},
		});

		// 			 _____     Si no está en ningún canal, busco el canal en el que está, guardo su nombre, le quito del canal, encuentro si hay más gente en ese canal y si no hay nadie más lo borro      _____

		if (!userChannel)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You are not in a channel"
			})
			return;
		}
		
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

		await this.prisma.joinedChannels.delete
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
				idChannel: userChannel.idChannel,
			},
		});
		
		if (allElements.length == 0)
		{
			// 			 _____     borrar todos los baneados también     _____

			await this.prisma.userMutedChannel.deleteMany
			({
				where:
				{
					idChannel: userChannel.idChannel,
				},
			})

			await this.prisma.usersBannedChannel.deleteMany
			({
				where:
				{
					idChannel: userChannel.idChannel,
				},
			})

			await this.prisma.channel.delete
			({
				where:
				{
					Name: userChannel.idChannel,
				},
			})
		}
	}

	async ft_list(body: any, socket: Socket)
	{
		//              ______     buscar channels     ______

		const this_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (!this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't exist, for some reason"
			})
			return;
		}

		const all_channels = await this.prisma.channel.findMany
		({
			where:
			{
				isPrivate: false,
			},
		});
		
		this.server.to(socket.id).emit('onMessage',
		{
			user: "",
			message: "Channels:",
		});
		
		for (const each_channel of all_channels)
		{
			this.server.to(socket.id).emit('onMessage',
			{
				user: "",
				message: ("-   " + each_channel.Name),
			});
		}
	}

	async ft_admin_list(body: any, socket: Socket)
	{
		//              ______     buscar channels     ______

		const this_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
	  	});

		if (!this_user)
		{
			this.server.to(socket.id).emit('onAdminMessage', {
				user: 'Server',
				message: "You don't exist, for some reason"
			})
			return;
		}
	
		if (!this_user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "Your login not found"
			});
			return;
		}
 
		if (this_user.webRol == "user")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "You don't have the privileges."
			});
			return;
		}
 
		const all_channels = await this.prisma.channel.findMany
		({
			where:
			{
			},
		});
		
		this.server.to(socket.id).emit('onAdminMessage',
		{
			user: "",
			message: "Channels:",
		});
		
		for (const each_channel of all_channels)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "",
				message: ("-   " + each_channel.Name),
			});
		}
	}

	async ft_kick(body: any, socket: Socket)
	{
		const words = body.message.split(' ');

		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/kick [user]"
			});
			return;
		}

		const this_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (!this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't exist, for some reason"
			})
			return;
		}

		const to_kick_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: words[1],
			},
		});

		if (!to_kick_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "User not found"
			})
			return;
		}

		//              ______     Get joinedChannels     ______
		const JoinedChannels_this_user = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: this_user.login_42
			},
		});

		const JoinedChannels_user_to_kick = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: to_kick_user.login_42
			},
		});

		if (!JoinedChannels_this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You are not on a channel"
			})
			return;
		}

		if (!JoinedChannels_user_to_kick || JoinedChannels_user_to_kick.idChannel != JoinedChannels_this_user.idChannel)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "The user is not on this channel"
			})
			return;
		}

		if (this_user.channelRol != "owner" && (this_user.channelRol != "admin" || to_kick_user.channelRol != 'user'))
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't have permissions to kick that user"
			})
			return;
		}

		await this.prisma.joinedChannels.delete
		({
			where:
			{
				idUser: to_kick_user.login_42,
			},
		})

		this.server.to(socket.id).emit('onMessage',
		{
			user: "Server",
			message: "You kicked " + to_kick_user.nickname,
		});

		this.server.to(to_kick_user.socketId).emit('onMessage',
		{
			user: "Server",
			message: "You were kicked by " + this_user.nickname,
		});
	}

	async ft_ban(body: any, socket: Socket)
	{
		const words = body.message.split(' ');

		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/ban [user]"
			});
			return;
		}

		const this_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (!this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't exist, for some reason"
			});
			return;
		}

		const to_ban_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: words[1],
			},
		});

		if (!to_ban_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "User not found"
			});
			return;
		}
	
		const JoinedChannels_this_user = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: this_user.login_42,
			},
		});

		const JoinedChannels_user_to_ban = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: to_ban_user.login_42,
			},
		});

		if (!JoinedChannels_this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You are not on a channel"
			})
			return;
		}

		if (!JoinedChannels_user_to_ban || JoinedChannels_user_to_ban.idChannel != JoinedChannels_this_user.idChannel)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "The user is not on this channel"
			})
			return;
		}

		if (this_user.channelRol != "owner" && (this_user.channelRol != "admin" || to_ban_user.channelRol != 'user'))
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't have permissions to ban that user"
			})
			return;
		}

		await this.prisma.joinedChannels.delete
		({
			where:
			{
				idUser: to_ban_user.login_42
			},
		});

		const HasBeenBanned = await this.prisma.usersBannedChannel.findFirst
		({
			where:
			{
				idUser: to_ban_user.login_42,
				idChannel: JoinedChannels_this_user.idChannel
			},
		});
		
		if (!HasBeenBanned)
		{
			await this.prisma.usersBannedChannel.create
			({
				data:
				{
					idUser: to_ban_user.login_42,
					idChannel: JoinedChannels_this_user.idChannel
				}
			});
		}

		this.server.to(socket.id).emit('onMessage',
		{
			user: "Server",
			message: "You banned " + words[1],
		});

		this.server.to(to_ban_user.socketId).emit('onMessage',
		{
			user: "Server",
			message: "You were banned by " + this_user.login_42,
		});
	}

	async ft_mute(body: any, socket: Socket)
	{
		const words = body.message.split(' ');

		if (words.length < 3)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/mute [user] [time]"
			});
			return;
		}

		if (!(/^\d+$/.test(words[2])))
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "Time does not have the correct format"
			});
			return;
		}

		const this_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (!this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't exist, for some reason"
			});
			return;
		}
		
		const to_mute_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: words[1],
			},
		});

		if (!to_mute_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "User not found"
			});
			return;
		}

		const JoinedChannels_this_user = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: this_user.login_42,
			},
		});

		const JoinedChannels_user_to_mute = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: to_mute_user.login_42,
			},
		});

		if (!JoinedChannels_this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You are not on a channel"
			})
			return;
		}

		if (!JoinedChannels_user_to_mute || JoinedChannels_user_to_mute.idChannel != JoinedChannels_this_user.idChannel)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "The user is not on this channel"
			})
			return;
		}

		if (this_user.channelRol != "owner" && (this_user.channelRol != "admin" || to_mute_user.channelRol != 'user'))
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't have permissions to mute that user"
			})
			return;
		}
		
		const ReleaseDate: Date = new Date();
		ReleaseDate.setSeconds(ReleaseDate.getSeconds() + parseInt(words[2]));

		await this.prisma.userMutedChannel.create
		({
			data:
			{
				idUser: to_mute_user.login_42,
				idChannel: JoinedChannels_this_user.idChannel,
				dateAllowedIn: ReleaseDate,
			},
		});

		this.server.to(socket.id).emit('onMessage',
		{
			user: "Server",
			message: "You muted " + words[1] + " for " + words[2] + " seconds.",
		});

		this.server.to(to_mute_user.socketId).emit('onMessage',
		{
			user: "Server",
			message: "You were muted by " + this_user.login_42 + " for " + words[2] + " seconds.",
		});
	}

	async ft_giveAdmin(body: any, socket: Socket)
	{
		const words = body.message.split(' ');

		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/giveAdmin [User]"
			})
			return;
		}

		const this_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (!this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't exist, for some reason"
			});
			return;
		}

		const to_admin_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: words[1],
			},
		});

		if (!to_admin_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "User not found"
			});
			return;
		}

		const JoinedChannels_this_user = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: this_user.login_42,
			},
		});

		const JoinedChannels_to_admin_user = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: to_admin_user.login_42,
			},
		});

		if (!JoinedChannels_this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You are not on a channel"
			})
			return;
		}

		if (!JoinedChannels_to_admin_user || JoinedChannels_to_admin_user.idChannel != JoinedChannels_this_user.idChannel)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "The user is not on this channel"
			})
			return;
		}

		if (this_user.channelRol != "owner")
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't have permissions to make that user admin"
			})
			return;
		}

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

		this.server.to(socket.id).emit('onMessage',
		{
			user: "Server",
			message: "You made " + to_admin_user.nickname + " admin.",
		});

		this.server.to(to_admin_user.socketId).emit('onMessage',
		{
			user: "Server",
			message: "You were made admin by " + this_user.nickname + ". Congratulations!",
		});
	}

	async ft_changePassword(body: any, socket: Socket)
	{
		const words = body.message.split(' ');

		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/changePassword [User]"
			});
			return;
		}

		const this_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (!this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't exist, for some reason"
			});
			return;
		}

		const JoinedChannels_this_user = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: this_user.login_42,
			},
		});

		if (!JoinedChannels_this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You are not on a channel"
			});
			return;
		}

		if (this_user.channelRol != "owner")
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You are not the owner"
			});
			return;
		}

		const encryptedPassword = await this.encryptPassword(words[1]);

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

		this.server.to(socket.id).emit('onMessage',
		{
			user: "Server",
			message: "You changed the Password",
		});
	}

	async ft_help(body: any, socket: Socket)
	{
		const words = body.message.split(' ');

		if (words.length < 1)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/help"
			});
			return;
		}

		const this_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (!this_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't exist, for some reason"
			});
			return;
		}



		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "Commands:"
		});		
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/dm [User] [message]"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/block [User]"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/unblock"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/friends"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/showProfile [User]"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/join [ChannelName] [password:[urPass] / noPassword] [public / private]"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/leave"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/list"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/kick [user]"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/ban[user]"
		});

		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/mute [user] [time]"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/giveAdmin [User]"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/changePassword [User]"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/listMatches"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/spectate"
		});
		this.server.to(socket.id).emit('onMessage', {
			user: '',
			message: "/challenge [User] ?wall"
		});
	}

	async ft_rules(body: any, socket: Socket)
	{
		this.server.to(socket.id).emit('onMessage', {
			user: 'Server',
			message: "Reglas: Golpea la pelota para que traspase las defensas de tu contrincante y conseguir puntos, el primero que llegue a 10 puntos gana la partida.\nControles: subir con [W]/[upArrow], bajar con [S]/[downArrow]."
		})
	}

	async ft_send(body: any, socket: Socket)
	{
		const this_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});
		const channel_user = await this.prisma.joinedChannels.findFirst
		({
			where:
			{
				idUser: body.userName,
			},
		});
		
		if (!channel_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You are not in a channel"
			})
			return;
		}
		if (!this_user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "Your login not found"
			});
			return;
		}
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

			//              ______     Si está muteado     ______
			var isAllowedToTalk = true;

			const muted_channel_exists = await this.prisma.userMutedChannel.findFirst
			({
				where:
				{
					idUser: this_user.login_42,
					idChannel: channel_user.idChannel,
				},
			});

			if (muted_channel_exists)
			{
				const dateNow: Date = new Date();
	
				if (dateNow >= muted_channel_exists.dateAllowedIn)
				{
					isAllowedToTalk = true;
					const deleteUser = await this.prisma.userMutedChannel.deleteMany
					({
						where:
						{
							idUser: body.userName,
							idChannel: channel_user.idChannel,
						},
					})
				}
				else
				{
					isAllowedToTalk = false;
				}
			}



			if (!isBlocked && !urBlocked && isAllowedToTalk)
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
						message: "[" + channel_user.idChannel + "] "  + body.message
					});
				}
			}
		}
	}

































































	async ft_admin_ban(body: any, socket: Socket)
	{
		const words : string[] = body.message.split(' ');

		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "/banFromWeb [login_42]"
			});
			return;
		}

		const user = await this.prisma.user.findUnique({
			where: {
				login_42: words[1]
			}
		});

		const this_user = await this.prisma.user.findUnique({
			where: {
				login_42: body.userName,
			}
		});

		if (!user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "User login not found"
			});
			return;
		}

		if (!this_user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "Your login not found"
			});
			return;
		}
		if (this_user.webRol == "user")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "You don't have the privileges."
			});
			return;
		}
		if (user.webRol == "owner")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "You can't expell the owner"
			});
			return;
		}
		await this.prisma.user.update({
			where: {
				login_42: words[1]
			},
			data: {
				expelled: true
			}
		});

		this.server.to(user.socketId).emit('expulsion');

		this.server.to(socket.id).emit('onAdminMessage',
		{
			user: "Server",
			message: "User expulsion completed"
		});
	}

	async ft_admin_give_mod(body: any, socket: Socket)
	{
		const words : string[] = body.message.split(' ');

		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "/giveMod [login_42]"
			});
			return;
		}
		const user = await this.prisma.user.findUnique({
			where: {
				login_42: words[1]
			}
		});
		const this_user = await this.prisma.user.findUnique({
			where: {
				login_42: body.userName,
			}
		});
		if (!user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "User login not found"
			});
			return;
		}
		if (!this_user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "Your login not found"
			});
			return;
		}

		if (user.webRol == "owner")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "You can't change the owner rol"
			});
			return;
		}
		if (user.webRol == "moderator")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "Alredy a moderator"
			});
			return;
		}
		if (this_user.webRol == "user")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "You don't have the privileges."
			});
			return;
		}
		await this.prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				webRol: "moderator"
			}
		});
		this.server.to(socket.id).emit('onAdminMessage',
		{
			user: "Server",
			message: "User made web admin"
		});

		this.server.to(user.socketId).emit('update');
	}

	async ft_admin_remove_mod(body: any, socket: Socket)
	{
		const words : string[] = body.message.split(' ');

		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "/removeMod [login_42]"
			});
			return;
		}

		const user = await this.prisma.user.findUnique({
			where: {
				login_42: words[1]
			}
		});
		
		const this_user = await this.prisma.user.findUnique({
			where: {
				login_42: body.userName,
			}
		});

		if (!user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "User login not found"
			});
			return;
		}
		if (!this_user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "Your login not found"
			});
			return;
		}
		if (this_user.webRol == "user")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "You don't have the privileges."
			});
			return;
		}
		if (user.webRol == "user")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "This user is not a mod."
			});
			return;
		}		


		if (user.webRol == "owner")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "You can't change the owner rol"
			});
			return;
		}

		await this.prisma.user.update({
			where: {
				id: user.id
			},
			data: {
				webRol: "user"
			}
		});

		this.server.to(socket.id).emit('onAdminMessage',
		{
			user: "Server",
			message: "User removed from web admins"
		});

		this.server.to(user.socketId).emit('update');
	}

	async ft_admin_help(body: any, socket: Socket)
	{
		const this_user = await this.prisma.user.findUnique({
			where: {
				login_42: body.userName,
			}
		});
        if (!this_user)
       {
           this.server.to(socket.id).emit('onAdminMessage',
           {
               user: "Server",
               message: "Your login not found"
           });
           return;
       }
       if (this_user.webRol == "user")
       {
           this.server.to(socket.id).emit('onAdminMessage',
           {
               user: "Server",
               message: "You don't have the privileges."
           });
           return;
       }
		this.server.to(socket.id).emit('onAdminMessage',
		{
			user: "Server",
			message: "/deleteChannel, /banFromWeb, /listAllChannels, /giveMod, /removeMod, /giveChannelAdmin, /revokeChannelAdmin, /help"
		});
	}

	async ft_admin_send(body: any, socket: Socket)
	{
		const users = await this.prisma.user.findMany({
			where: {
				OR: [
					{webRol: "owner"},
					{webRol: "moderator"}
				]
			}
		});

		for (const user of users)
		{
			this.server.to(user.socketId).emit('onAdminMessage',
			{
				user: body.userName,
				message: body.message
			});
		}
	}

	async ft_listMatches(body: any, socket: Socket)
	{
		const all_matches_playing = await this.prisma.gameRooms.findMany
		({
			where:
			{
				waiting: false,
			},
		});

		this.server.to(socket.id).emit('onMessage',
		{
			user: "",
			message: "Game Rooms:",
		});

		for (const room of all_matches_playing)
		{
			this.server.to(socket.id).emit('onMessage',
			{
				user: "",
				message: ("-   ID : [" + room.id + "]" ),
			});
		}
	}

	async ft_admin_giveChannelAdmin(body: any, socket: Socket)
	{
		const words : string[] = body.message.split(' ');

		if (words.length < 3)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "/giveChannelAdmin [user] [channel]"
			});
			return;
		}

		// Check that the users exist
		const user = await this.prisma.user.findUnique({
			where: {
				login_42: words[1]
			}
		});
		const this_user = await this.prisma.user.findUnique({
			where: {
				login_42: body.userName,
			}
		});
		if (!user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "User login not found"
			});
			return;
		}
		if (!this_user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "Your login not found"
			});
			return;
		}
		// Check that the user that ask is an Admin
		if (this_user.webRol == "user")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "You don't have the privileges."
			});
			return;
		}
		// Look for the Channel and the JoinedChannel
		const channel_exists = await this.prisma.channel.findFirst
		({
			where:
			{
				Name: words[2]
			}
		});

		const is_on_channel = await this.prisma.joinedChannels.findUnique
		({
			where:
			{
				idUser: words[1],
				idChannel: words[2]
			},
		});
 
		// Check that all conditions meet to be an admin
		if (!channel_exists)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "This channel doesn't exists."
			});
			return;
		}
		if (!is_on_channel)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "This user is not in the channel."
			});
			return;
		}
		if (user.channelRol == "admin" || user.channelRol == "owner")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "This user alredy has privilages."
			});
			return;
		}
		
		// Make admin
		await this.prisma.user.update({
			where: {
				login_42: user.login_42
			},
			data: {
				channelRol: "admin"
			}
		});

		this.server.to(user.socketId).emit('onMessage',
		{
			user: "Server",
			message: "You are now a Channel Admin thank to the Web Admins"
		});

		this.server.to(socket.id).emit('onAdminMessage',
		{
			user: "Server",
			message: "Admin channel privileges given"
		});
	}

	async ft_admin_revokeChannelAdmin(body: any, socket: Socket)
	{
		const words : string[] = body.message.split(' ');

		if (words.length < 3)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "/revokeChannelAdmin [user] [channel]"
			});
			return;
		}

		// Check that the users exist
		const user = await this.prisma.user.findUnique({
			where: {
				login_42: words[1]
			}
		});
		const this_user = await this.prisma.user.findUnique({
			where: {
				login_42: body.userName,
			}
		});
		if (!user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "User login not found"
			});
			return;
		}
		if (!this_user)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "Your login not found"
			});
			return;
		}
		// Check that the user that ask is an Admin
		if (this_user.webRol == "user")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "You don't have the privileges."
			});
			return;
		}
		// Look for the Channel and the JoinedChannel
		const channel_exists = await this.prisma.channel.findFirst
		({
			where:
			{
				Name: words[2]
			}
		});

		const is_on_channel = await this.prisma.joinedChannels.findUnique
		({
			where:
			{
				idUser: words[1],
				idChannel: words[2]
			},
		});
 
		// Check that all conditions meet to be an admin
		if (!channel_exists)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "This channel doesn't exixsts."
			});
			return;
		}
		if (!is_on_channel)
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "This user is not in the channel."
			});
			return;
		}
		if (user.channelRol == "user")
		{
			this.server.to(socket.id).emit('onAdminMessage',
			{
				user: "Server",
				message: "This user alredy doesn't have privilages."
			});
			return;
		}
		
		// Make admin
		await this.prisma.user.update({
			where: {
				login_42: user.login_42
			},
			data: {
				channelRol: "user"
			}
		});

		this.server.to(user.socketId).emit('onMessage',
		{
			user: "Server",
			message: "You are now a simple Channel User thank to the Web Admins >:("
		});

		this.server.to(socket.id).emit('onAdminMessage',
		{
			user: "Server",
			message: "Admin channel privileges revoked"
		});
	}




























































	async ft_spectate(body: any, socket: Socket)
	{
		const words : string[] = body.message.split(' ');

		const matchExists = await this.prisma.gameRooms.findUnique({
			where: {
				id: parseInt(words[1])
			}
		})
		
		if (!matchExists)
		{
			this.server.to(socket.id).emit('onMessage',
			{
				user: "Server",
				message: "No room found"
			});
			return;
		}
		
		if (matchExists.waiting == true)
		{
			this.server.to(socket.id).emit('onMessage',
			{
				user: "Server",
				message: "Match has not started yet"
			});
			return;
		}

		if (gameRooms[words[1]].socket1.id == socket.id ||
			gameRooms[words[1]].socket2.id == socket.id)
		{
			this.server.to(socket.id).emit('onMessage',
			{
				user: "Server",
				message: "You are already on that match"
			});
			return;
		}

		this.server.to(socket.id).emit('onMessage',
		{
			user: body.userName,
			message: "",
			other: 
				{
					command: "Spectate",
					match: words[1]
				},
		});
	}

	async ft_challenge(body: any, socket: Socket)
	{
		const words = body.message.split(' ');

		if (words.length < 2)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "/challenge [User] ?wall"
			});
			return;
		}

		const my_user = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: body.userName,
			},
		});

		if (!my_user)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You don't exist, for some reason"
			});
			return;
		}

		var alreadyOnMatch : boolean = false;
		const matches = await this.prisma.gameRooms.findMany
		({
			where: {
				idPlayerLeft: my_user.id
			}
		});

		if (matches.length > 0)
			alreadyOnMatch = true;

		const matches2 = await this.prisma.gameRooms.findMany
		({
			where: {
				idPlayerRight: my_user.id,
				waiting: false
			}
		});

		if (matches2.length > 0)
			alreadyOnMatch = true;

		if (alreadyOnMatch)
		{
			this.server.to(socket.id).emit('onMessage',
			{
				user: "Server",
				message: "You are already on a match"
			});
			return;
		}

		const user_to_challenge = await this.prisma.user.findUnique
		({
			where:
			{
				login_42: words[1],
			},
		});

		if (!user_to_challenge)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "User not found"
			})
			return;
		}

		if (user_to_challenge.id == my_user.id)
		{
			this.server.to(socket.id).emit('onMessage', {
				user: 'Server',
				message: "You can't challenge yourself"
			})
			return;
		}

		var gameMode = "normal";
		if (words.length >= 3)
		{
			if (words[2] != "wall")
			{
				this.server.to(socket.id).emit('onMessage', {
					user: 'Server',
					message: "The second parameter is not literally 'wall'. If you want a normal match don't write extra params."
				})
				return;
			}
			gameMode = "wall";
		}

		const game = await this.prisma.gameRooms.create({
			data: {
				idPlayerLeft: my_user.id,
				idPlayerRight: user_to_challenge.id,
				waiting: true,
				findingMatch: false,
				modoDeJuego: gameMode,
				ranked: false
			}
		});

		var roomName : string = game.id.toString();
		socket.join(roomName);
		gameRooms[roomName] = new gameRoom(roomName, this.server, socket, my_user.id, (gameMode == "wall"), this);

		this.server.to(socket.id).emit('FindingMatch');

		this.server.to(user_to_challenge.socketId).emit('onMessage',
		{
			user: user_to_challenge.nickname,
			message: "You have been challenged by " + my_user.nickname
		});

		this.server.to(user_to_challenge.socketId).emit('GetChallenged');
	}

	async ft_finishGame(body: any)
	{
		const game = await this.prisma.gameRooms.findUnique({
			where: {
				id: body.id
			}
		})

		if (!game)
			return;

		const winner = await this.prisma.user.findUnique({
			where: {
				id: body.winnerId
			}
		})

		if (!winner)
			return;

		const looser = await this.prisma.user.findUnique({
			where: {
				id: body.looserId
			}
		})

		if (!looser)
			return;


		//remove active game
		await this.prisma.gameRooms.delete({
			where: {
				id: game.id
			}
		})

		//create history
		await this.prisma.matches.create({
			data: {
				idUsuarioVictoria: winner.id,
				idUsuarioDerrota: looser.id,
				modoDeJuego: body.gameMode,
				ranked: game.ranked
			}
		})

		if (game.ranked == true)
		{
			//subir ganador
			var status = (winner.socketId != "") ? "online" : "offline";
			await this.prisma.user.update({
				where: {
					id: body.winnerId
				},
				data: {
					status: status,
					elo: {
						increment: 10,
					},
				}
			});
			
			//bajar perdedor
			status = (looser.socketId != "") ? "online" : "offline";
			await this.prisma.user.update({
				where: {
					id: body.looserId
				},
				data: {
					status: status,
					elo: {
						decrement: 8,
					},
				}
			});
		}

		gameRooms.delete(body.roomName);
	}
}

/*
**		_________________________     other classes and functions     _________________________
*/

class gameRoom
{
	private pos =
	{
		player1_x: 15, player1_y: 405,

		player2_x: 1240, player2_y: 405,

		player1_p: 0, player2_p: 0,

		ball_x: 628, ball_y: 430, ball_ang: 0, ball_speed: 0,

		wall_x: 628, wall_y: 430, wall_ang: (Math.PI / 2), wall_speed: 0, wall_status: false
	}

	public keysPressed1: { [key: string]: boolean } = {};
	public keysPressed2: { [key: string]: boolean } = {};

	public roomName: string;

	private server: Server;

	public gameStatus: boolean;

	public socket1 : Socket;
	public socket2 : Socket;

	public idPlayer1 : number;
	public idPlayer2 : number;

	private gateway : MyGateway;

	constructor (room: string, sv: Server, socket: Socket, idPlayer1: number, gameMode: boolean, gateway: MyGateway)
	{
		this.roomName = room;
		this.server = sv;
		this.idPlayer1 = idPlayer1;
		this.socket1 = socket;
		this.gameStatus = false;
		this.pos.wall_status = gameMode;

		this.gateway = gateway;
	}

	getStatus(): boolean
	{
		return this.gameStatus;
	}

	async gameLoop(socket : Socket, idPlayer2 : number)
	{
		this.server.to(this.roomName).emit('StartMatch');

		this.socket2 = socket;
		this.idPlayer2 = idPlayer2;
		this.gameStatus = true;
		this.pos.ball_speed = 8;
		this.initWall()
		this.initBall()
		setInterval(() => {this.playerMove()}, 4)
		setInterval(() => {this.hitboxCheck()}, 4)
		setInterval(() =>
		{
			if (this.gameStatus == false)
				return;
			this.pos.ball_x += Math.cos(this.pos.ball_ang) * this.pos.ball_speed;
			this.pos.ball_y += Math.sin(this.pos.ball_ang) * -this.pos.ball_speed;
			if (this.pos.wall_status == true)
			{
				this.pos.wall_y += Math.sin(this.pos.wall_ang) * -this.pos.ball_speed;
				if (this.pos.wall_y < 0)
				{
					this.pos.wall_ang = Math.PI * 1.5;
					this.pos.wall_speed = (Math.floor(Math.random() * 3) + 1);
				}
				else if (this.pos.wall_y > 820)
				{
					this.pos.wall_ang = Math.PI * 0.5;
					this.pos.wall_speed = (Math.floor(Math.random() * 3) + 1);
				}
			}
			
			if (this.pos.ball_x < 0 || this.pos.ball_x > 1280)
			{
				if (this.pos.ball_x > 1280)
					this.pos.player1_p += 1;
				if (this.pos.ball_x < 0)
					this.pos.player2_p += 1;
				if (this.pos.player1_p > 9 || this.pos.player2_p > 9)
					this.endGame();
				this.initBall();
				this.initWall()
				this.initPlayers();
			}
			this.server.to(this.roomName).emit('gameChanges', this.pos);
		}, 16);
	}

	endGame()
	{
		this.gameStatus = false;
		this.server.to(this.roomName).emit('gameFinished');

		const winnerId = (this.pos.player1_p > 9) ? this.idPlayer1 : this.idPlayer2;
		const looserId = (this.pos.player1_p > 9) ? this.idPlayer2 : this.idPlayer1;

		this.socket1.leave(this.roomName);
		this.socket2.leave(this.roomName);
		
		this.gateway.ft_finishGame({
			id: parseInt(this.roomName),
			winnerId: winnerId,
			looserId: looserId,
			gameMode: (this.pos.wall_status == true) ? "wall" : "normal"
		});
	}

	hitboxCheck()
	{
		if (this.gameStatus == false)
			return;

		if (((this.pos.ball_x + 10) > this.pos.player1_x && (this.pos.ball_x + 10) < this.pos.player1_x + 15) 
			&& ((this.pos.ball_y + 10) > this.pos.player1_y && (this.pos.ball_y + 10) < this.pos.player1_y + 70))
		{
			if (((this.pos.player1_y - (this.pos.ball_y + 10)) * -1) <= 20)
				this.pos.ball_ang = Math.PI * 0.25;
			if (((this.pos.player1_y - (this.pos.ball_y + 10)) * -1) > 20 && ((this.pos.player1_y - (this.pos.ball_y + 10)) * -1) <= 50)
				this.pos.ball_ang = Math.PI * 2;
			if (((this.pos.player1_y - (this.pos.ball_y + 10)) * -1) > 50)
				this.pos.ball_ang = Math.PI * 1.75;
		}
		if (((this.pos.ball_x + 10) > this.pos.player2_x && (this.pos.ball_x + 10) < this.pos.player2_x + 15) 
			&& ((this.pos.ball_y + 10) > this.pos.player2_y && (this.pos.ball_y + 10) < this.pos.player2_y + 70))
		{
			if (((this.pos.player2_y - (this.pos.ball_y + 10)) * -1) <= 20)
				this.pos.ball_ang = Math.PI * 0.75;
			if (((this.pos.player2_y - (this.pos.ball_y + 10)) * -1) > 20 && ((this.pos.player2_y - (this.pos.ball_y + 10)) * -1) <= 50)
				this.pos.ball_ang = Math.PI;
			if (((this.pos.player2_y - (this.pos.ball_y + 10)) * -1) > 50)
				this.pos.ball_ang = Math.PI * 1.25;
		}
		if (this.pos.wall_status == true)
		{
			if (((this.pos.ball_x + 10) > this.pos.wall_x && (this.pos.ball_x + 10) < this.pos.wall_x + 7) 
				&& ((this.pos.ball_y + 10) > this.pos.wall_y && (this.pos.ball_y + 10) < this.pos.wall_y + 140))
			{
				if (((this.pos.wall_y - (this.pos.ball_y + 10)) * -1) <= 50)
					this.pos.ball_ang = Math.PI * 0.75;
				else if (((this.pos.wall_y - (this.pos.ball_y + 10)) * -1) > 50 && ((this.pos.wall_y - (this.pos.ball_y + 10)) * -1) <= 90)
					this.pos.ball_ang = Math.PI;
				else if (((this.pos.wall_y - (this.pos.ball_y + 10)) * -1) > 90)
					this.pos.ball_ang = Math.PI * 1.25;
			}
			else if (((this.pos.ball_x + 10) > this.pos.wall_x + 7 && (this.pos.ball_x + 10) < this.pos.wall_x + 15) 
				&& ((this.pos.ball_y + 10) > this.pos.wall_y && (this.pos.ball_y + 10) < this.pos.wall_y + 140))
			{
				if (((this.pos.wall_y - (this.pos.ball_y + 10)) * -1) <= 50)
					this.pos.ball_ang = Math.PI * 0.25;
				else if (((this.pos.wall_y - (this.pos.ball_y + 10)) * -1) > 50 && ((this.pos.wall_y - (this.pos.ball_y + 10)) * -1) <= 90)
					this.pos.ball_ang = 0;
				else if (((this.pos.wall_y - (this.pos.ball_y + 10)) * -1) > 90)
					this.pos.ball_ang = Math.PI * 1.75;
			}
		}
		if ((this.pos.ball_y + 10) < 0 && this.pos.ball_ang == (Math.PI * 0.25))
			this.pos.ball_ang = Math.PI * 1.75;
		else if ((this.pos.ball_y + 10) < 0 && this.pos.ball_ang == (Math.PI * 0.75))
			this.pos.ball_ang = Math.PI * 1.25;
		else if ((this.pos.ball_y + 10) > 960 && this.pos.ball_ang == (Math.PI * 1.75))
			this.pos.ball_ang = Math.PI * 0.25;
		else if ((this.pos.ball_y + 10) > 960 && this.pos.ball_ang == (Math.PI * 1.25))
			this.pos.ball_ang = Math.PI * 0.75;
	}

	playerMove()
	{
		if (this.gameStatus == false)
			return;
		if (this.keysPressed1["w"] || this.keysPressed1["ArrowUp"])
		{
			this.pos.player1_y -= 1;
			if (this.pos.player1_y < 0)
				this.pos.player1_y = 0;
		}
		if (this.keysPressed1["s"] || this.keysPressed1["ArrowDown"])
		{
			this.pos.player1_y += 1;
			if (this.pos.player1_y > 890)
				this.pos.player1_y = 890;
		}
		if (this.keysPressed2["w"] || this.keysPressed2["ArrowUp"])
		{
			this.pos.player2_y -= 1;
			if (this.pos.player2_y < 0)
				this.pos.player2_y = 0;
		}
		if (this.keysPressed2["s"] || this.keysPressed2["ArrowDown"])
		{
			this.pos.player2_y += 1;
			if (this.pos.player2_y > 890)
				this.pos.player2_y = 890;
		}
	}

	initWall()
	{
		let position = Math.floor(Math.random() * 3);
		let direction = Math.floor(Math.random() * 2);
		let speed = (Math.floor(Math.random() * 3) + 1);

		if (position == 0)
			this.pos.wall_y = 0;
		else if (position == 1)
			this.pos.wall_y = 430;
		else if (position == 2)
			this.pos.wall_y = 940;

		if(this.pos.wall_y == this.pos.ball_y)
			this.initWall();
		else
		{
			this.pos.wall_speed = speed;
			if (direction == 0)
				this.pos.wall_ang = Math.PI * 0.5;
			else
				this.pos.wall_ang = Math.PI * 1.50;
		}
	}

	initBall()
	{
		let position = Math.floor(Math.random() * 3);
		let direction = Math.floor(Math.random() * 2);

		this.pos.ball_x = 628;
		if (position == 0)
		{
			this.pos.ball_y = 0;
			if (direction == 0)
				this.pos.ball_ang = Math.PI * 1.75;
			else
				this.pos.ball_ang = Math.PI * 1.25;
		}
		else if (position == 1)
		{
			this.pos.ball_y = 430;
			if (direction == 0)
				this.pos.ball_ang = 0;
			else
				this.pos.ball_ang = Math.PI;
		}
		else if (position == 2)
		{
			this.pos.ball_y = 940;
			if (direction == 0)
				this.pos.ball_ang = Math.PI * 0.25;
			else
				this.pos.ball_ang = Math.PI * 0.75;
		}	
	}

	initPlayers()
	{
		this.pos.player1_y = 405;
		this.pos.player2_y = 405;
	}
}