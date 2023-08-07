import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClient, Prisma } from '@prisma/client'
import { ForbiddenException } from '@nestjs/common';
import { Injectable, Post } from "@nestjs/common";
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from '@nestjs/config'



@Injectable({})
export class AuthService
{
	constructor(
		private prisma: PrismaService,
		private jwt: JwtService,
		private config: ConfigService
	) {}
   
	// _____    S I G N     U P     ______
	// ___________________________________
	
	async signup(dto: AuthDto)
	{
		
	// ___  Generate the password hash ___ 
	
		const hash = await argon.hash(dto.password);



		
	// ___ Save the new user in the DB ___ 

		try
		{
			const user = await this.prisma.user.create
			({
				data:
				{
					email: dto.email,
					hash,																				//  No debería ser "hash: hash" ? 
				},
			});

	// 		___ Return the savd user ___

			return this.signToken(user.id, user.email);
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




	// _____    S I G N     I N     ______
	// ___________________________________
 
	async signin(dto: AuthDto)
	{
		// ___ Find User by Email ___

		const user = await this.prisma.user.findUnique
		({
			where: 
			{
				email: dto.email,
			},
		});




		// ___ If user does not exist throw exception ___

		if (!user)
			throw new ForbiddenException('Credentials incorrect'); 




		// ___ Compare password ___

		const PasswordMatches = await argon.verify(user.hash, dto.password)




		// ___ If password incorrect throw exception ___

		if (!PasswordMatches)
			throw new ForbiddenException('PW Credentials incorrect'); 



		// ___ Send back the user ___

		return this.signToken(user.id, user.email);
	}

	async signToken(userId: number, email: string) : Promise< {access_token: string} > {
		const payload = {
			sub: userId,
			email,
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
}