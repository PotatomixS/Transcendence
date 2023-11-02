import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Profile, ProfileService, Match } from '../services/profile-service/profile.service';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-otherprofile-page',
  templateUrl: './otherprofile-page.component.html',
  styleUrls: ['./otherprofile-page.component.css']
})

export class OtherProfilePageComponent implements OnInit {
  profile: Profile;
  profileImage: any;

  matches: Match[];

  constructor(private service: ProfileService, private aroute: ActivatedRoute) 
  {
    this.profile = {
      id: "",
      nickname: "",
      login_42: "",
      img_str: "default_user.png",
      auth2FA: false,
      elo: 0,
      wins: 0,
      loses: 0
    };

    this.matches = [];
  }

  ngOnInit()
  {
    const login = this.aroute.snapshot.params["login_42"];
    //TODO: change 0 for the user selected
    this.service.getOtherProfile(login).subscribe(res => 
    {
      this.profile = res;
      this.service.getProfileImage(res.img_str).subscribe(
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
      this.service.getProfileMatches(login).subscribe(list => {
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
}