import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})

export class ProfilePageComponent {
  profileForm = new FormGroup({
    username: new FormControl('Default Username'),
    factor_auth: new FormControl(false),
  });

  fileName = '';

  onFileSelected(event: any) {

  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.profileForm.value);
  }
}