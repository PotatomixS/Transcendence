import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
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
	
	constructor(private chatService: ChatService)
	{
		
	}
	
	ngOnInit()
	{
		this.chatService.getMessages().subscribe((value) =>
		{
			this.messages.push(value.user + ": " + value.message);
		});
	}
	
	sendMessage()
	{
		this.chatService.sendMessage(this.message);
		this.message = '';
	}
	
	onKeyDownChatFinder(key: KeyboardEvent)
	{
		if (key.key == "Enter") //unirse al canal
		console.log(this.ChatFinder.value);
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