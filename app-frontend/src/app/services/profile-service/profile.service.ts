import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { io } from 'socket.io-client';

export interface Profile {
  id: string;
  nickname: string;
  login_42: string;
  img_str: string;
  auth2FA: boolean;
  elo: number;
  wins: number;
  loses: number;
}

export interface Match {
  against: string,
  gamemode: string,
  result: string
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  socket: any;
	userName = "";

  profile: BehaviorSubject<Profile>;
  constructor(private http: HttpClient, private domSanitizer: DomSanitizer)
  {
    this.profile = new BehaviorSubject<Profile>({
      id: "",
      nickname: "",
      login_42: "",
      img_str: "default_user.png",
      auth2FA: false,
      elo: 0,
      wins: 0,
      loses: 0
    });
  }

  initSocket()
  {
    this.socket = io('http://' + window.location.host + ':3000');
    this.socket.on('connect', () =>
    {
      this.socket.on('InitSocketId', () =>
      {
        this.socket.emit('newUserAndSocketId', {userName: this.profile.getValue().login_42});
      });
    });
  }

  getProfile() {
    const params = {
      login_42: this.profile.getValue().login_42
    };

    this.http.post<Profile>('api/users/profileInfo', params).subscribe(res => {
      this.profile.next(res);
    });
  }

  getOtherProfile(login_42: string) : Observable<Profile> {
    const params = {
      login_42: login_42
    };

    return this.http.post<Profile>('api/users/profileInfo', params);
  }

  addFriend(login_42: string) : Observable<any> {
    const params = {
      login_42: this.profile.getValue().login_42,
      login_42_friend: login_42
    };

    return this.http.post<any>('api/users/addFriend', params);
  }

  removeFriend(login_42: string) : Observable<any> {
    const params = {
      login_42: this.profile.getValue().login_42,
      login_42_friend: login_42
    };

    return this.http.post<any>('api/users/removeFriend', params);
  }

  getIfFriends(login_42: string) : Observable<boolean> {
    const params = {
      login_42: this.profile.getValue().login_42,
      login_42_friend: login_42
    };

    return this.http.post<boolean>('api/users/getIfFriends', params);
  }

  getProfileMatches(login_42: string) : Observable<any[]>{
    const params = {
      login_42: login_42
    };

    return this.http.post<any[]>('api/users/profileInfoMatches', params);
  }
  getOnMatch() : Observable<any>{
    const params = {
      login_42: this.profile.getValue().login_42,
    };

    return this.http.post<any>('api/users/getCurrentMatch', params);
  }

  getChallenges() : Observable<any[]>{
    const params = {
      login_42: this.profile.getValue().login_42,
    };

    return this.http.post<any[]>('api/users/profileInfoChallenges', params);
  }

  cancelFind(id: number) : Observable<any[]>{
    const params = {
      id
    };

    return this.http.post<any[]>('api/users/cancelFind', params);
  }

  findMatch() : Observable<any>
  {
    const params = {
      login_42: this.profile.getValue().login_42
    };

    return this.http.post<any>('api/users/findMatch', params);
  }

  acceptChallenge(challenge_id: number) : Observable<any>
  {
    const params = {
      login_42: this.profile.getValue().login_42,
      room_id: challenge_id
    };

    return this.http.post<any>('api/users/acceptChallenge', params);
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

  updateProfile(data: any, img_str: string = ""): Observable<any> {
    data = {
      login_42: this.profile.getValue().login_42,
      nickname: data.nickname,
      auth2FA: data.auth2FA
    }
    if (img_str != "")
      data["img_str"] = img_str;
    return this.http.post<any>('api/users/setProfileInfo', data);
  }

  updateProfileImage(imageForm: FormData): Observable<any> {
    return this.http.post<any>('api/users/setProfileInfoImage', imageForm);
  }
}
