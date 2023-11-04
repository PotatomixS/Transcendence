import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClient, Prisma } from '@prisma/client'
import { ForbiddenException } from '@nestjs/common';
import { Injectable, Post } from "@nestjs/common";
import { AuthDto } from './dto';
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from '@nestjs/config'
import axios from 'axios';


// Send Emails

import * as nodemailer from 'nodemailer';




// _____    S I G N     U P     ______



@Injectable({})
export class AuthService
{
	clientId = this.config.get('CLIENT_UID');
	clientSecret = this.config.get('CLIENT_SECRET');
	redirectUri = this.config.get('REDIRECT_URI');
	grantType = "authorization_code";

	constructor(
		private prisma: PrismaService,
		private jwt: JwtService,
		private config: ConfigService
	) {}


	async get42URL()
	{
		return {
			url: 'https://api.intra.42.fr/oauth/authorize?client_id=' + this.clientId + '&redirect_uri=' + encodeURI(this.redirectUri) + '&response_type=code'
		}
	}

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
				const newUser = await this.prisma.user.create
				({
					data:
					{
						code2FA: "",
						login_42: user_gotten,
						nickname: user_gotten,
						email_42: email_gotten,		//CHAGNE
						socketId: ""
					},
				});

				return {
					login_42: newUser.login_42,
					nickname: newUser.nickname,
					email: newUser.email_42,
					img_str: newUser.img_str,
					wins: 0,
					loses: 0
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
			//sign fallado por 2FA activo
			user.code2FA = await this.sendEmail(email_gotten);

			const updateResponse = await this.prisma.user.update
			({
				where: {
					login_42: user.login_42
				},
				data:
				{
					code2FA: user.code2FA
				},
			});

			return {
				login_42: user.login_42,
				error: "Requires 2FA code.",
				FA_error: true
			};
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

		//	Return User
		const token = await this.signToken(user.id);
		return {
			login_42: user.login_42,
			nickname: user.nickname,
			img_str: user.img_str,
			elo: user.elo,
			wins: wins,
			loses: loses,
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




	// _____    T R Y	C O D E    ______

	async check_code(str)
	{
		const user = await this.prisma.user.findUnique
		({
			where: 
			{
				login_42: str.login_42,
			},
		});
		//intento de sign desde pantalla 2FA
		if (str.code2FA != user.code2FA)
			return { error: "Invalid code "};

		//	Return User
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

		const token = await this.signToken(user.id);
		return {
			response: "ok",
			login_42: user.login_42,
			nickname: user.nickname,
			img_str: user.img_str,
			auth2FA: user.auth2FA,
			elo: user.elo,
			wins: wins,
			loses: loses,
			access_token: token.access_token
		};
	}


	// _____    G E T    U S E R    ______

	async get_user(str)
	{
		console.log(this.redirectUri);
		try
		{
			const response = await axios.post(
			  'https://api.intra.42.fr/oauth/token',
			  {
				client_id: this.clientId,
				redirect_uri: this.redirectUri,
				client_secret: this.clientSecret,
				code: str.code,
				grant_type: this.grantType,
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
				subject: 'TURURURU',
				text: 'YASIFJOSFIJ SJIODIASODMNKSNDK AFIJISJF ..\nY_o_u_r _c_o_d_e_ _i_s_ _:___' + random_str,
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
