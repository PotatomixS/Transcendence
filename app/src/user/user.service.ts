import { PrismaService } from "src/prisma/prisma.service";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from '@nestjs/config'

@Injectable({})
export class UserService
{
    constructor(
		private prisma: PrismaService,
		private jwt: JwtService,
		private config: ConfigService
	) {}

    // _____    G E T	P R O F I L E	I N F O    ______
	
	async getProfileInfo(str)
	{
		//	Look for user in db
		//console.log(str.);
		const user = await this.prisma.user.findUnique
		({
			where: 
			{
				login_42: str.login_42
			},
		});

		//	Return User
		if (!user)
		{
			return {error: "no user found."};
		}

		const wins = await this.prisma.matches.count
			({
				where: {
					idUsuarioVictoria: user.id
				}
			});
		
		const loses = await this.prisma.matches.count
			({
				where: {
					idUsuarioDerrota: user.id
				}
			});

		return {
			auth2FA: user.auth2FA,
			elo: user.elo,
			email_42: user.email_42,
			id: user.id,
			img_str: user.img_str,
			login_42: user.login_42,
			nickname: user.nickname,
			socketId: user.socketId,
			wins: wins,
			loses: loses
		};
	}

	// _____    A D D	F R I E N D    ______
	
	async addFriend(str)
	{
		const user = await this.prisma.user.findUnique
		({
			where: 
			{
				login_42: str.login_42
			}
		});

		const friend = await this.prisma.user.findUnique
		({
			where: 
			{
				login_42: str.login_42_friend
			}
		});

		const newFriend = await this.prisma.friends.create
		({
			data:
			{
				idUser1: user.id,
				idUser2: friend.id
			},
		});
	}

	// _____    R E M O V E 	F R I E N D    ______
	
	async removeFriend(str)
	{
		const friendRecord = await this.prisma.friends.deleteMany
		({
			where: 
			{
				OR:
				[
					{
						AND:
						{
							friendUser1: {
								login_42: {
									equals: str.login_42
								}
							},
							friendUser2: {
								login_42: {
									equals: str.login_42_friend
								}
							}
						}
					},
					{
						AND:
						{
							friendUser1: {
								login_42: {
									equals: str.login_42_friend
								}
							},
							friendUser2: {
								login_42: {
									equals: str.login_42
								}
							}
						}
					}
				]
			}
		});
	}

	// _____    G E T	I F		F R I E N D    ______
	
	async getIfFriends(str)
	{
		const areFriends = await this.prisma.friends.count
		({
			where: 
			{
				OR:
				[
					{
						AND:
						{
							friendUser1: {
								login_42: {
									equals: str.login_42
								}
							},
							friendUser2: {
								login_42: {
									equals: str.login_42_friend
								}
							}
						}
					},
					{
						AND:
						{
							friendUser1: {
								login_42: {
									equals: str.login_42_friend
								}
							},
							friendUser2: {
								login_42: {
									equals: str.login_42
								}
							}
						}
					}
				]
			}
		});
		console.log(str);
		console.log(areFriends);
		return (areFriends >= 1);
	}

	// _____    G E T	P R O F I L E	M A T C H E S    ______
	
	async getProfileMatches(str)
	{
		//	Look for user in db
		//console.log(str.);
		const user = await this.prisma.user.findUnique
		({
			where: 
			{
				login_42: str.login_42
			},
		});

		//	Return User
		if (!user)
		{
			return {error: "no user found."};
		}

		const matches = await this.prisma.matches.findMany
			({
				where: {
					OR: [
						{idUsuarioVictoria: user.id},
						{idUsuarioDerrota: user.id}
					]
				},
				include: {
					userWon: true,
					userLost: true
				}
			});

		return matches;
	}

	// _____    S E T	P R O F I L E	I N F O    ______
	async setProfileInfo(str)
	{
		let dataToUpdate = {
			nickname: str.nickname,
			auth2FA: str.auth2FA
		};
		
		if (str?.img_str)
			dataToUpdate["img_str"] = str.img_str

		const updateResponse = await this.prisma.user.update
		({
			where: {
				login_42: str.login_42
			},
			data: dataToUpdate
			
		});


		return {
			response: "Todo ok"
		};
	}
}