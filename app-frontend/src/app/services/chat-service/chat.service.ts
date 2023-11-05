import { Injectable } from '@angular/core';
import { Profile, ProfileService } from '../profile-service/profile.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ChatService
{
	constructor(private profileService: ProfileService)
	{
	}

	sendMessage(message: string)
	{
		this.profileService.socket.emit('newMessage', {userName: this.profileService.profile.getValue().login_42, message: message});
	}

	getMessages()
	{
		let observable = new Observable<{ user: String, message: String, other: any }>(observer => 
		{
			this.profileService.socket.on('onMessage', (data: any) =>
			{
				observer.next(data);
			});
			return () => { this.profileService.socket.disconnect(); };  
		});
		return observable;
	}
	
}