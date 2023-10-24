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
    auth2FA: new FormControl()
  });

  testValue: Observable<Profile> = this.service.profile;

  constructor (private service : ProfileService)
  {
    this.image = null;
    this.choosen = false;
  }

  ngOnInit()
  {
    this.testValue.subscribe(res => {
      this.profileForm.setValue({
        nickname: res.nickname,
        auth2FA: res.auth2FA
      });
    });
  }

  onFileSelected(event: any) {
    if (event.target.value)
    {
      this.image = <File>event.target.files[0];
      this.choosen = true;
    }
  }

  onSubmit() {
    if (this.choosen == true)
    {
      let fd = new FormData();
      fd.append('file', this.image, this.image.name);
      
      this.service.updateProfileImage(fd).subscribe(res => {
        console.log(res);
        this.service.updateProfile(this.profileForm.value, res.filename);
      });
    }
    else
      this.service.updateProfile(this.profileForm.value);

    // TODO: Use EventEmitter with form value
    
  }
}