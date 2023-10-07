import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs';

export interface Profile {
  nick: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  constructor(private http: HttpClient) { }

  getProfile(): Observable<Profile> {

    const headers = new HttpHeaders(
    {
      'Content-Type': 'application/x-www-form-urlencoded'
    });
    
    const params: Profile = {
			nick: "123"
		};

    return this.http.get<Profile>('api');
    //return this.http.post<Profile>("api/auth/signup", params, { 'headers': headers });
  }

  setProfile(profile : Profile): Observable<Profile> {
    return this.http.get<Profile>('api');
  }
}