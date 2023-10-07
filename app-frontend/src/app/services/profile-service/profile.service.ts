import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Profile {
  title: string;
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
        title: "123"
      };
  
      //return this.http.post<Profile>("api/auth/signup", params, { 'headers': headers });
      return this.http.get<Profile>("api");
  }
}
