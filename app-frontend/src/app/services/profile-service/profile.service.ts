import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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

  constructor(private http: HttpClient, private domSanitizer: DomSanitizer) { }

  getProfile(): Observable<Profile> {
      const params: Profile = {
        id: "string",
        nickname: "string",
        login_42: "bremesar",
        img_str: "string"
      };
      return this.http.post<Profile>('api/users/profileInfo', params);
      //return this.http.get<Profile>('api');
  }

  getProfileImage(): Observable<Blob> {
    return this.http.get('api/users/profileInfoImage', { responseType: 'blob' });
    //return this.http.get<Profile>('api');
  }

  createImageFromBlob(imageUrl: Blob): Promise<SafeUrl> {
      return new Promise<SafeUrl>((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener(
          "load",
          () => {
            resolve(this.domSanitizer.bypassSecurityTrustUrl(reader.result as string));
          }
        );

        if (imageUrl) {
          reader.readAsDataURL(imageUrl);
        } else {
          reject();
        }
      });
    }

  updateProfileImage(image: FormData): Observable<Profile> {
    return this.http.post<Profile>('api/users/upload', {file: image});
    //return this.http.get<Profile>('api');
  }
}
