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
  }
  
  onKeyDownChatFinder(key: KeyboardEvent)
  {
    if (key.key == "Enter") //unirse al canal
    console.log(this.ChatFinder.value);
  }
  
  onKeyDownMessageBox(key: KeyboardEvent)
  {
    if (key.key == "Enter" && this.MessageBox.value) //enviar mensaje
    {
      this.messages.push("user: " + this.MessageBox.value);
      this.MessageBox.reset();
      var nbr: number = Number(document.getElementById("chat")?.scrollHeight);
      document.getElementById("chat")?.scrollTo(0, nbr);
    }
  }
}
