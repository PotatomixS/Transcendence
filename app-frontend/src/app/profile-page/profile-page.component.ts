import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})

export class ProfilePageComponent implements OnInit {

  constructor (private profileService : ProfileService) { }

  profileForm = new FormGroup({
    username: new FormControl('Default Username'),
    factor_auth: new FormControl(false),
  });

  fileName = '';

  ngOnInit()
  {
    this.getProfile();
  }

  getProfile()
  {
    this.profileService.getProfile()
      .subscribe(
        res => console.log(res),
        err => console.log(err)
      )
  }

  onFileSelected(event: any) {

  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.profileForm.value);

  }
}