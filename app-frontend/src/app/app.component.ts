import { Component } from '@angular/core';
import { SharedService } from './services/shared-service/shared.service';
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

	ShowLogin: boolean;
	
	constructor(private service: SharedService, private http: HttpClient, private route: ActivatedRoute) 
	{
		this.ShowLogin = false;
		//alert(this.getQueryParameter("code"));
	}

	private getQueryParameter(key: string): string {
		const parameters = new URLSearchParams(window.location.search);
		return String(parameters.get("code"));
	}
	
	ngOnInit() 
	{
		
	}
}