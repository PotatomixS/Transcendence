import { Component } from '@angular/core';
import { AuthService } from './services/auth-service/auth.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ProfileService, Profile } from './services/profile-service/profile.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent
{  
	title = 'Transcendence';

	ShowLogin:	boolean;
	ShowPage: boolean;
	
	constructor(private service: AuthService, private profileService: ProfileService, private http: HttpClient, private route: Router) 
	{
		this.ShowLogin = false;
		this.ShowPage = false;
	}

	private getQueryParameter(): string {
		const parameters = new URLSearchParams(window.location.search);
		return String(parameters.get("code"));
	}
	
	ngOnInit() 
	{
		this.service.logged.subscribe(res => {
			this.ShowLogin = !res;
			this.ShowPage = res;
			if (this.ShowPage == true)
				return;
		});

		if (this.service.getToken().length > 0)
		{
			this.service.logged.next(true);
		}
		else if (this.getQueryParameter() != null && this.getQueryParameter().length > 0)
		{
			this.ShowLogin = false;
			this.service.getSign(this.getQueryParameter()).subscribe(
				response => {
					if (response?.expelled)
					{
						alert(response.expelled);
						return;
					}

					//profile update
					const newProfile: Profile = {
						id: "",
						nickname: "",
						login_42: response.login_42,
						img_str: "default_user.png",
						auth2FA: false,
						elo: 0,
						wins: 0,
						loses: 0,
						webRol: "user"
					};
					this.profileService.profile.next(newProfile);

					if (response?.access_token)
					{
						this.service.setToken(response.access_token);

						this.profileService.getProfile();

						this.service.logged.next(true);

						this.ShowPage = true;
						
						this.profileService.initSocket();

						if (response?.new)
							this.route.navigate(['/profile'])
						else
							this.route.navigate(['/pong'])
					}
					else
					{
						if (response?.FA_error)
						{
							//profile update
							newProfile.auth2FA = true;
							this.profileService.profile.next(newProfile);

							this.service.faActive.next(true);
						}
						this.ShowLogin = true;
					}
				},
			);
		}
	}
}