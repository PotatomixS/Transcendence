import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router'
import { ChatService } from '../services/chat-service/chat.service';

@Component({
	selector: 'app-admin-page',
	templateUrl: './admin-page.component.html',
	styleUrls: ['./admin-page.component.css']
})

export class AdminPageComponent
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
		this.chatService.getAdminMessages().subscribe((value) =>
		{
			this.messages.push(value.user + ": " + value.message);
		});
	}
	
	sendMessage()
	{
		this.chatService.sendAdminMessage(this.message);
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