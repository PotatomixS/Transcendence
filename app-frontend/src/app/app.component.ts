import { Component } from '@angular/core';
import { AuthResponse, AuthService } from './services/auth-service/auth.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent
{  
	title = 'Transcendence';

	ShowLogin:	boolean;
	code: string;
	token: any;

	sign: Observable<AuthResponse>;
	
	constructor(private service: AuthService, private http: HttpClient, private route: ActivatedRoute) 
	{
		this.code = this.getQueryParameter("code");
		this.sign = this.service.getSign(this.code);
		this.ShowLogin = true;
		this.token = "";
	}

	private getQueryParameter(key: string): string {
		const parameters = new URLSearchParams(window.location.search);
		return String(parameters.get("code"));
	}
	
	ngOnInit() 
	{
		if (this.token.length > 0)
		{
			this.ShowLogin = false;
			return;
		}
		if (this.code.length > 0)
		{
			this.sign.subscribe(response => {
				if (response?.access_token)
				{
					this.ShowLogin = false;
					this.token = response?.access_token;
					this.service.setToken(this.token);
				}
				else
					console.log(response?.error);
			});
		}
	}
}