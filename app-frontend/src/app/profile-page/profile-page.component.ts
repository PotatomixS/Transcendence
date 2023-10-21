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

  constructor (private service : ProfileService)
  {
    this.image = null;
    this.choosen = false;
  }

  profileForm = new FormGroup({
    username: new FormControl('Default Username'),
    factor_auth: new FormControl(false),
  });

  testValue: Observable<Profile> = this.service.getProfile();

  ngOnInit()
  {
    //this.getProfile();
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
    if (this.image)
    {
      fd.append('ProfileImage', this.image, this.image.name);
      this.service.updateProfileImage(fd).subscribe(res => {
        console.log("Succis");
      })
    }
  }
}