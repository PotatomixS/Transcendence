import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClient, Prisma } from '@prisma/client'
import { ForbiddenException } from '@nestjs/common';
import { Injectable, Post } from "@nestjs/common";
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from '@nestjs/config'
import axios from 'axios';


const clientId = "u-s4t2ud-5e8f32562427f9c449ce50ffca3a6f29bae38a94655ea0187a79435bbcf03307";
const redirectUri = "http://localhost/pong";
const clientSecret = "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";
const code2 = "0888ae267f7cbcfdba94cf0d5546476bcb97e45fcbf24bc14e25d06237b4de25";
const grantType = "authorization_code";










// _____    S I G N     U P     ______



@Injectable({})
export class AuthService
{

	constructor(
		private prisma: PrismaService,
		private jwt: JwtService,
		private config: ConfigService
	) {}




	// _____    S I G N     U P     ______
	
	async sign(str)
	{
		//	Look for user in db

		const user_gotten = await this.get_user(str);
		
		const user = await this.prisma.user.findUnique
		({
			where: 
			{
				login_42: user_gotten,
			},
		});




		//	Create User
		
		if (!user)
		{
			try
			{
				const user = await this.prisma.user.create
				({
					data:
					{
						login_42: user_gotten,
						nickname: user_gotten,
					},
				});

				return {
					nickname: user.nickname,
					img_str: user.img_str
				};

			}
			catch (error)
			{
				if (error instanceof Prisma.PrismaClientKnownRequestError)
				{
					if (error.code === 'P2002')
					{
						throw new ForbiddenException('Credentials taken');
					}
				}
				throw error;
			}
		}




		//	Return User

		return {
			nickname: user.nickname,
			img_str: user.img_str
		};
	}











	// _____    G E T    U S E R    ______

	async get_user(str)
	{
		try {
			const response = await axios.post(
			  'https://api.intra.42.fr/oauth/token',
			  {
				client_id: clientId,
				redirect_uri: redirectUri,
				client_secret: clientSecret,
				code: str.code,
				grant_type: grantType,
			  }
			);
		
			const accessToken = response.data.access_token;

			const meResponse = await axios.get('https://api.intra.42.fr/v2/me', {
			  headers: {
				Authorization: `Bearer ${accessToken}`,},
			});

			return (meResponse.data.login);


			} catch (error) {
				console.error('Error:', error.response ? error.response.data : error.message);
			}
	}
}















































































// 	// _____    S I G N     U P     ______
// 	// ___________________________________
	
// 	async sign(dto: AuthDto)
// 	{
		
// 	// ___  Generate the password hash ___ 
	
// 		// const hash = await argon.hash(dto.password);



		
// 	// ___ Save the new user in the DB ___ 

// 		try
// 		{
// 			const user = await this.prisma.user.create
// 			({
// 				data:
// 				{
// 					login_42: "",
// 					nickname: "",
// 				},
// 			});

// 	// 		___ Return the savd user ___

// 			return this.signToken(user.id);
// 		}
// 		catch (error)
// 		{
// 			if (error instanceof Prisma.PrismaClientKnownRequestError)
// 			{
// 				if (error.code === 'P2002')
// 				{
// 					throw new ForbiddenException('Credentials taken');
// 				}
// 			}
// 			throw error;
// 		}
// 	}




// 	// _____    S I G N     I N     ______
// 	// ___________________________________
 
// 	async signin(dto: AuthDto)
// 	{
// 		// ___ Find User by Email ___

// 		const user = await this.prisma.user.findUnique
// 		({
// 			where: 
// 			{
// 				login_42: "",
// 			},
// 		});




// 		// ___ If user does not exist throw exception ___

// 		if (!user)
// 			throw new ForbiddenException('Credentials incorrect'); 




// 		// ___ Compare password ___

// 		// const PasswordMatches = await argon.verify(user.hash, dto.password)




// 		// ___ If password incorrect throw exception ___

// 		// if (!PasswordMatches)
// 		// 	throw new ForbiddenException('PW Credentials incorrect'); 



// 		// ___ Send back the user ___

// 		return this.signToken(user.id);
// 	}

// 	async signToken(userId: number) : Promise< {access_token: string} > {
// 		const payload = {
// 			sub: userId,
// 		};

// 		const secret = this.config.get('JWT_SECRET');
		
// 		const token = await this.jwt.signAsync(
// 			payload,
// 			{
// 				expiresIn: '15m',
// 				secret: secret,
// 			}
// 		);
		
		
// 		return{
// 			access_token: token, 
// 		};
// 	}
// }
