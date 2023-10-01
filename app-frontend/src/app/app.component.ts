import { Component } from '@angular/core';
import { SharedService } from './shared.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent
{  
	title = 'Transcendence';
	ShowLogin: boolean; //TODO Esto es true mientras no se tenga el token del cliente
	
	constructor()
	{
		this.ShowLogin = false;
	}

	ToggleShowLogin()
	{
		this.ShowLogin = false;
	};
}
