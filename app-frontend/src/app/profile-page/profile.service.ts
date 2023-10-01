import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

interface Profile {
  nick: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  BASE_URL: string = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>('${this.BASE_URL}/auth/signin');
  }

  setProfile(profile : Profile): Observable<Profile> {
    return this.http.post<Profile>('${this.BASE_URL}/auth/signup', profile);
  }
}