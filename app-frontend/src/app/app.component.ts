import { Component } from '@angular/core';
import { SharedService } from './shared.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent
{  
	
	title = 'Transcendence';
	ShowLogin: boolean;
	private apiUrl = 'https://api.intra.42.fr/oauth/token';
	
	
	constructor(private http: HttpClient, private route: ActivatedRoute) 
	{
		this.ShowLogin = true;
		//alert(this.getQueryParameter("code"));
	}

	private getQueryParameter(key: string): string {
		const parameters = new URLSearchParams(window.location.search);
		return String(parameters.get("code"));
	}
	
	ngOnInit() 
	{
		//alert(this.getQueryParameter("code"));
		const clientId = 'u-s4t2ud-5e8f32562427f9c449ce50ffca3a6f29bae38a94655ea0187a79435bbcf03307';
		const clientSecret = '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';
		const code = this.getQueryParameter("code");
		const redirectUri = 'http://localhost/pong';
		const headers = new HttpHeaders(
		{
			'Content-Type': 'application/x-www-form-urlencoded'
		});
		const params = new HttpParams()
		 .set('grant_type', 'authorization_code')
		 .set('client_id', clientId)
		 .set('client_secret', clientSecret)
		 .set('code', code)
		 .set('redirect_uri', redirectUri);
		this.http.post(this.apiUrl, params, { headers }).subscribe(data => console.log(data));
	}
}
	
interface CodeReturn
{
	access_token: string;
	token_type: string;
	expires_in: number;
	refresh_token: string;
	scope: string;
	created_at: number;
	secret_valid_until: number;
}
	
interface CodePost
{
	client_id: string;
	redirect_uri: string;
	client_secret: string;
	code: string;
	grant_type: string;
}