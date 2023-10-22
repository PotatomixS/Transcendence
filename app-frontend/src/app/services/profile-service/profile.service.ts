import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface Profile {
  id: string;
  nickname: string;
  login_42: string;
  img_str: string;
  auth2FA: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  login_42: string;
  constructor(private http: HttpClient, private domSanitizer: DomSanitizer)
  {
    this.login_42 = "";
  }

  getProfile(): Observable<Profile> {
    const params = {
      login_42: this.login_42
    };

    return this.http.post<Profile>('api/users/profileInfo', params);
    //return this.http.get<Profile>('api');
  }

  getProfileImage(image: string): Observable<Blob> {
    const params = {
      image
    };
    return this.http.post('api/users/profileInfoImage', params, { responseType: 'blob' });
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

  updateProfile(data: any): Observable<any> {
    return this.http.post<any>('api/users/setProfileInfo', data);
  }

  updateProfileImage(image: FormData): Observable<Profile> {
    return this.http.post<Profile>('api/users/upload', {file: image});
  }
}
