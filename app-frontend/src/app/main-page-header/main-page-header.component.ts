import { Component } from '@angular/core';
import { Profile, ProfileService } from '../services/profile-service/profile.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth-service/auth.service';
import {APP_BASE_HREF} from '@angular/common';

@Component({
  selector: 'app-main-page-header',
  templateUrl: './main-page-header.component.html',
  styleUrls: ['./main-page-header.component.css']
})
export class MainPageHeaderComponent {
    profile: Observable<Profile> = this.service.profile.asObservable();
    profileImage: any;

    constructor(private service: ProfileService, private auth: AuthService, private http: HttpClient, private router: Router) 
    {
    }
    ngOnInit()
    {
      this.service.profile.subscribe(res => 
        {
          this.service.getProfileImage(res.img_str).subscribe(
            imgBlob => {
              this.service.createImageFromBlob(imgBlob).then(
                result => {
                  this.profileImage = result;
                },
                err => {
                }
              )
          });
        });
    }

    Logout()
    {
      this.auth.setToken("");
      this.auth.logged.next(false);
    }
}
