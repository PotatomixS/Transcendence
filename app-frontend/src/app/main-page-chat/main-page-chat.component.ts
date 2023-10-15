import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-main-page-chat',
  templateUrl: './main-page-chat.component.html',
  styleUrls: ['./main-page-chat.component.css']
})
export class MainPageChatComponent
{
  message: string = "";
  messages: (string | null)[] = [];
  ChatFinder = new FormControl('');
  MessageBox = new FormControl('');

  constructor()
  {

  }

  ngOnInit()
  {
    var chat: HTMLElement | null = document.getElementById("chat");

    chat?.addEventListener("onresize", (event) => 
    {
      console.log(chat?.scrollHeight);
      chat?.scrollTo(0, chat?.scrollHeight);
    })
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
      this.messages.push("user: " + this.MessageBox.value);
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
