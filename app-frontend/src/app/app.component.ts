import { Component } from '@angular/core';
import { AuthService } from './services/auth-service/auth.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
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
	loggedIn: Observable<boolean>;
	
	constructor(private service: AuthService, private profileService: ProfileService, private http: HttpClient, private route: ActivatedRoute) 
	{
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
			this.service.getSign(this.getQueryParameter()).subscribe(
				response => {
					//profile update
					const newProfile: Profile = {
						id: "",
						nickname: "",
						login_42: response.login_42,
						img_str: "",
						auth2FA: false
					};
					this.profileService.profile.next(newProfile);

					if (response?.access_token)
					{
						//profile update
						newProfile.nickname = response.nickname;
						newProfile.img_str = response.img_str;
						this.profileService.profile.next(newProfile);

						this.service.setToken(response.access_token);
						this.service.logged.next(true);
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
						console.log(response?.error);
					}
				},
				err => console.log('HTTP Error', err)
			);
		}
	}
}