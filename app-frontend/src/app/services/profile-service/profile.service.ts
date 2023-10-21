import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Profile {
  id: string;
  nickname: string;
  login_42: string;
  img_str: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private http: HttpClient) { }

  getProfile(): Observable<Profile> {
      const headers = new HttpHeaders(
      {
      });
      const params: Profile = {
        id: "string",
        nickname: "string",
        login_42: "bremesar",
        img_str: "string"
      };
      return this.http.post<Profile>('api/users/profileInfo', params, { 'headers': headers });
      //return this.http.get<Profile>('api');
  }

  updateProfileImage(image: FormData): Observable<Profile> {
    return this.http.post<Profile>('api/users/upload', {file: image});
    //return this.http.get<Profile>('api');
}
}
