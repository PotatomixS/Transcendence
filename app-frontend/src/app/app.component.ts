import { Component } from '@angular/core';
import { AuthResponse, AuthService } from './services/auth-service/auth.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ProfileService } from './services/profile-service/profile.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent
{  
	title = 'Transcendence';

	ShowLogin:	boolean;
	loggedIn: Observable<boolean>;

	sign: Observable<AuthResponse>;
	
	constructor(private service: AuthService, private profile: ProfileService, private http: HttpClient, private route: ActivatedRoute) 
	{
		this.sign = this.service.getSign(this.getQueryParameter());
		this.ShowLogin = true;
		this.loggedIn = this.service.logged;
	}

	private getQueryParameter(): string {
		const parameters = new URLSearchParams(window.location.search);
		return String(parameters.get("code"));
	}
	
	ngOnInit() 
	{
		this.loggedIn.subscribe(res => {
			this.ShowLogin = !res;
		});

		if (this.service.getToken().length > 0)
		{
			this.service.logged.next(true);
			return;
		}
		if (this.getQueryParameter() != null && this.getQueryParameter().length > 0)
		{
			this.sign.subscribe(
				response => {
					this.profile.login_42 = response.login_42;
					console.log(response);
					if (response?.access_token)
					{
						this.service.setToken(response.access_token);
						this.service.logged.next(true);
					}
					else
					{
						if (response?.FA_error)
							this.service.faActive.next(true);
						console.log(response?.error);
					}
				},
				err => console.log('HTTP Error', err)
			);
		}
	}
}