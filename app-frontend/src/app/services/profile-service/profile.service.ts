import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
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

  profile: BehaviorSubject<Profile>;
  constructor(private http: HttpClient, private domSanitizer: DomSanitizer)
  {
    this.profile = new BehaviorSubject<Profile>({
      id: "",
      nickname: "",
      login_42: "",
      img_str: "default_user.png",
      auth2FA: false
    });
  }

  getProfile() {
    console.log(this.profile.getValue());
    const params = {
      login_42: this.profile.getValue().login_42
    };

    this.http.post<Profile>('api/users/profileInfo', params).subscribe(res => this.profile.next(res));
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

  updateProfile(data: any, img_str: string = "") {
    data = {
      login_42: this.profile.getValue().login_42,
      nickname: data.nickname,
      auth2FA: data.auth2FA
    }
    if (img_str != "")
      data["img_str"] = img_str;
    this.http.post<any>('api/users/setProfileInfo', data).subscribe(res => this.getProfile());
  }

  updateProfileImage(imageForm: FormData): Observable<any> {
    return this.http.post<any>('api/users/setProfileInfoImage', imageForm);
  }
}
