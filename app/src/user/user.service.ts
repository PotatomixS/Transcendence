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
			return {
				id: 'indefinido',
				nickname: 'indefinida',
				login_42: 'indefinido',
				img_str: 'default_user.png',
				auth2FA: false
			}
		}

		return user;
	}

	// _____    S E T	P R O F I L E	I N F O    ______
	//TODO
	async setProfileInfo(str)
	{
		const updateResponse = await this.prisma.user.update
		({
			where: {
				login_42: str.login_42
			},
			data:
			{
				nickname: str.nickname,
				auth2FA: str.auth2FA
			},
		});


		return {
			response: "Todo ok"
		};
	}
}