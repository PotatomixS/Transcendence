import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClient, Prisma } from '@prisma/client'
import { ForbiddenException } from '@nestjs/common';
import { Injectable, Post } from "@nestjs/common";
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from '@nestjs/config'
import axios from 'axios';


// Send Emails

import * as nodemailer from 'nodemailer';


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

		const all_info = await this.get_user(str);
		if (!all_info)
		{
			return {error: "Code error."};
		}

		const user_gotten = all_info.data.login;
		const email_gotten = all_info.data.email;

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
						code2FA: "",
						login_42: user_gotten,
						nickname: user_gotten,
						email_42: email_gotten,		//CHAGNE
					},
				});

				return {
					nickname: user.nickname,
					email: user.email_42,
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

		if (user.auth2FA == true)
		{
			user.code2FA = await this.sendEmail(email_gotten);
			return {
				error: "Requires 2FA code.",
				FA_error: true
			};
		}

		//	Return User
		const token = await this.signToken(user.id);
		return {
			nickname: user.nickname,
			img_str: user.img_str,
			access_token: token.access_token
		};
	}

	async signToken(userId: number) : Promise< {access_token: string} > {
		const payload = {
			sub: userId,
		};

		const secret = this.config.get('JWT_SECRET');
		
		const token = await this.jwt.signAsync(
			payload,
			{
				expiresIn: '15m',
				secret: secret,
			}
		);
		
		
		return{
			access_token: token, 
		};
	}









	// _____    G E T    U S E R    ______

	async get_user(str)
	{
		try
		{
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

			return (meResponse);
		} catch (error)
		{
			console.error('Error:', error.response ? error.response.data : error.message);
		}
	}



	// _____    S E N D    E M A I L    ______


	async sendEmail(str_email: string)
	{
		try
		{
			const random_ints: number[] = [];

			for (let i = 0; i < 6; ++i)
			random_ints[i] = Math.floor(Math.random() * 10);

			const random_str = random_ints[0].toString() + random_ints[1].toString() + random_ints[2].toString() + random_ints[3].toString() + random_ints[4].toString() + random_ints[5].toString();
			

			const transporter = nodemailer.createTransport(
			{
				service: 'Hotmail',
				auth:
				{
					user: 'ft_transcendence_penitencia@outlook.com',
					pass: 'Casablanca?si1234',
				},
			});
	  
			const mailOptions: nodemailer.SendMailOptions =
			{
				from: 'ft_transcendence_penitencia@outlook.com',
				to: str_email,
				subject: 'Hello from Node.js',
				text: 'You are going away to maybe never no more Norway see, your homeland behold..\nYour code is : ' + random_str,
			};
		
			const info = await transporter.sendMail(mailOptions);
			console.log('Email sent: ' + info.response);
			return (random_str);

			} catch (error)
			{
				console.error('Error sending email:', error);
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
