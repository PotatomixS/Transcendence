import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router } from '@angular/router'
import { ChatService } from '../services/chat-service/chat.service';

@Component({
	selector: 'app-main-page-chat',
	templateUrl: './main-page-chat.component.html',
	styleUrls: ['./main-page-chat.component.css']
})

export class MainPageChatComponent
{
	message: string = "";
	messages: (String | null)[] = [];
	ChatFinder = new FormControl('');
	MessageBox = new FormControl('');
	
	constructor(private chatService: ChatService, private route: Router)
	{
		
	}
	
	ngOnInit()
	{
		this.chatService.getMessages().subscribe((value) =>
		{
			if (value.other?.command)
			{
				switch(value.other.command)
				{
					case "Friend":
						this.route.navigate(['/otherprofile', value.other.friend]);
						break;
					case "Spectate":
						this.route.navigate(['/pong', value.other.match]);
						break;
				}
			}
			else
			{
				this.messages.push(value.user + ": " + value.message);
			}
		});
	}
	
	sendMessage()
	{
		this.chatService.sendMessage(this.message);
		this.message = '';
	}
	
	onKeyDownMessageBox(key: KeyboardEvent)
	{
		var chat: HTMLElement | null = document.getElementById("chat");
		if (key.key == "Enter" && this.MessageBox.value) //enviar mensaje
		{
		this.message = this.MessageBox.value;
		this.sendMessage()
		this.MessageBox.reset();
		requestAnimationFrame(() => {
			const chat = document.getElementById('chat');
			if (chat)
			{
				chat.scrollTop = chat.scrollHeight;
			}});
		}
	}
}
	
interface value
{
	user: string
	message: string
}