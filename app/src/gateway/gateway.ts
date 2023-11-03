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
			this.ballLoop();
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
		
		//              ______     Busca y crea canales     ______

		const words = body.message.split(' ');
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
				idUser: body.userName,
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

	/*
	**		_________________________     gameChanges     _________________________
	*/

	@SubscribeMessage('movePlayer1')
	onMovePlayer1(@MessageBody() key: { [key: string]: boolean })
	{
		if (key["w"])
		{
			pos.player1_y -= 25;
			if (pos.player1_y < 0)
				pos.player1_y = 0;
		}
		if (key["s"])
		{
			pos.player1_y += 25;
			if (pos.player1_y > 890)
				pos.player1_y = 890;
		}
		this.server.emit('gameChanges', pos);
	}

	@SubscribeMessage('movePlayer2')
	onMovePlayer2(@MessageBody() key: { [key: string]: boolean })
	{
		if (key["ArrowUp"])
		{
			pos.player2_y -= 25;
			if (pos.player2_y < 0)
				pos.player2_y = 0;
		}
		if (key["ArrowDown"])
		{
			pos.player2_y += 25;
			if (pos.player2_y > 890)
				pos.player2_y = 890;
		}
		this.server.emit('gameChanges', pos);
	}


	async ballLoop()
	{
		let direccion = Math.random();

		if (direccion)
			pos.ball_inc = 5;
		else
			pos.ball_inc = -5;
		setInterval(() =>
		{
			let bounce : number | null;
			pos.ball_x += pos.ball_inc;
			bounce = this.hitboxCheck(pos);
			if (bounce)
				pos.ball_ang = bounce;
			if (pos.ball_x < 0 || pos.ball_x > 1275)
				pos.ball_inc *= -1;
			this.server.emit('gameChanges', pos);
		}, 16);
	}

	hitboxCheck(data: any): number | null
	{
		if (((data.ball_x + 10) > data.player1_x && (data.ball_x + 10) < data.player1_x + 15) 
			&& ((data.ball_y + 10) > data.player1_y && (data.ball_y + 10) < data.player1_y + 70))
		{
			if ((data.player1_y - (data.ball_y + 10)) <= 20)
				return Math.PI * 0.25;
			if ((data.player1_y - (data.ball_y + 10)) > 20 && (data.player1_y - (data.ball_y + 10)) <= 50)
				return 0;
			if ((data.player1_y - (data.ball_y + 10)) > 50)
				return Math.PI * 1,75;
		}
		if (((data.ball_x + 10) > data.player2_x && (data.ball_x + 10) < data.player2_x + 15) 
			&& ((data.ball_y + 10) > data.player2_y && (data.ball_y + 10) < data.player2_y + 70))
		{
			if ((data.player2_y - (data.ball_y + 10)) <= 20)
				return Math.PI * 0,75;
			if ((data.player2_y - (data.ball_y + 10)) > 20 && (data.player2_y - (data.ball_y + 10)) <= 50)
				return Math.PI;
			if ((data.player2_y - (data.ball_y + 10)) > 50)
				return Math.PI * 1,25;
		}
		if ((data.ball_y + 10) < 0 && data.ball_ang == (Math.PI * 0,25))
			return Math.PI * 1,75;
		if ((data.ball_y + 10) < 0 && data.ball_ang == (Math.PI * 0,75))
			return Math.PI * 1,25;
		if ((data.ball_y + 10) > 960 && data.ball_ang == (Math.PI * 1,75))
			return Math.PI * 0,25;
		if ((data.ball_y + 10) > 960 && data.ball_ang == (Math.PI * 1,25))
			return Math.PI * 0,75;
		return null;
	}
}