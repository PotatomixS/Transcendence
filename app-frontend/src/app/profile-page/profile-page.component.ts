import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Profile, ProfileService, Match } from '../services/profile-service/profile.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css']
})

export class ProfilePageComponent implements OnInit {

  image: any;
  choosen: boolean;

  matches: Match[];
  
  profileForm = new FormGroup({
    nickname: new FormControl(),
    auth2FA: new FormControl()
  });

  profile: Observable<Profile> = this.service.profile.asObservable();

  constructor (private service : ProfileService)
  {
    this.image = null;
    this.choosen = false;
    this.matches = [];
  }

  ngOnInit()
  {
    this.profile.subscribe(res => {
      this.profileForm.setValue({
        nickname: res.nickname,
        auth2FA: res.auth2FA
      });
      
      this.matches = [];

      this.service.getProfileMatches(res.login_42).subscribe(list => {
        list.forEach( value =>
          {
            var matchInfo: Match = {
              against:'',
              gamemode:value.modoDeJuego,
              result:''
            };

            if (value.userLost.login_42 != res.login_42)
            {
              matchInfo.against = value.userLost.nickname;
              matchInfo.result = "Won";
            }
            else
            {
              matchInfo.against = value.userWon.nickname;
              matchInfo.result = "Lost";
            }
            this.matches.push(matchInfo);
          }
        ); 
      })
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
        alert("Updated!");
      });
    }
    else
    {
      this.service.updateProfile(this.profileForm.value);
      alert("Updated!");
    }

    // TODO: Use EventEmitter with form value
    
  }
}