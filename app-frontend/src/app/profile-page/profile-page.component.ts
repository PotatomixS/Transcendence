import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Profile, ProfileService } from '../services/profile-service/profile.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})

export class ProfilePageComponent implements OnInit {

  image: any;
  choosen: boolean;
  
  profileForm = new FormGroup({
    nickname: new FormControl(),
    auth2FA: new FormControl(),
    login_42: new FormControl()
  });

  testValue: Observable<Profile> = this.service.getProfile();

  constructor (private service : ProfileService)
  {
    this.image = null;
    this.choosen = false;
  }

  ngOnInit()
  {
    this.testValue.subscribe(res => {
      console.log(res);
      this.profileForm.setValue({
        nickname: res.nickname,
        auth2FA: res.auth2FA,
        login_42: this.service.login_42
      });
    });
  }

  

  /*getProfile()
  {
    this.service.getProfile()
      .subscribe(
        res => console.log(res),
        err => console.log(err)
      )
  }*/

  onFileSelected(event: any) {
    if (event.target.value)
    {
      this.image = <File>event.target.files[0];
      this.choosen = true;
    }
  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.profileForm.value);

    let fd = new FormData();
    this.service.updateProfile(this.profileForm.value).subscribe(res => {
      console.log(res);
    });
    if (this.image)
    {
      fd.append('ProfileImage', this.image, this.image.name);
      
      this.service.updateProfileImage(fd).subscribe();
    }
  }
}