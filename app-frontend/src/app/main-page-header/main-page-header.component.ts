import { Component } from '@angular/core';
import { Profile, ProfileService } from '../services/profile-service/profile.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-main-page-header',
  templateUrl: './main-page-header.component.html',
  styleUrls: ['./main-page-header.component.css']
})
export class MainPageHeaderComponent {
    profile: Observable<Profile> = this.service.getProfile();
    profileImage: any;

    constructor(private service: ProfileService, private http: HttpClient, private route: ActivatedRoute) 
    {
    }
    ngOnInit()
    {
      this.profile.subscribe();

      this.service.getProfileImage().subscribe(
        imgBlob => {
          this.service.createImageFromBlob(imgBlob).then(
            result => {
              this.profileImage = result;
            },
            err => {
              console.log(err);
            }
          )
        });
    }
}
