import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { Profile, ProfileService } from '../profile-service/profile.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ChatService
{
	private	socket = io('http://localhost:3000');
	public	userName = "";

	sendMessage(message: string)
	{
		this.socket.emit('newMessage', {userName: this.userName, message: message});
	}

	getMessages()
	{
		let observable = new Observable<{ user: String, message: String }>(observer => 
		{
			this.socket.on('onMessage', (data) =>
			{
				observer.next(data);
			});
			return () => { this.socket.disconnect(); };  
		});
		return observable;
	}


	constructor(profileService: ProfileService)
	{
		profileService.profile.subscribe((data) => 
		{
			this.userName = data.nickname;
			console.log("¿Quién es?: " + this.userName);
		});
	
		this.socket.on('connect', () =>
		{
			this.socket.on('InitSocketId', (g_socketId: string) =>
			{
				this.socket.emit('newUserAndSocketId', {userName: this.userName, socketId: g_socketId});
			});
		});
	}
}