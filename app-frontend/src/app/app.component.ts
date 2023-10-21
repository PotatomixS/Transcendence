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
	token: any;

	sign: Observable<AuthResponse>;
	
	constructor(private service: AuthService, private http: HttpClient, private route: ActivatedRoute) 
	{
		this.sign = this.service.getSign(this.getQueryParameter());
		this.ShowLogin = true;
		this.token = "";
	}

	private getQueryParameter(): string {
		const parameters = new URLSearchParams(window.location.search);
		return String(parameters.get("code"));
	}
	
	ngOnInit() 
	{
		if (this.service.getToken().length > 0)
		{
			this.ShowLogin = false;
			return;
		}
		if (this.getQueryParameter() != null && this.getQueryParameter().length > 0)
		{
			this.sign.subscribe(
				response => {
					if (response?.access_token)
					{
						this.ShowLogin = false;
						this.service.setToken(this.token);
						console.log(this.token);
					}
					else
					{
						if (response?.FA_error)
						{
							console.log("Entra");
							this.service.faActive.next(true);
						}
						console.log(response?.error);
					}
				},
				err => console.log('HTTP Error', err)
			);
		}
	}
}