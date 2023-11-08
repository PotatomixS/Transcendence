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

  isFriend: boolean;

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

    this.isFriend = false;

    this.matches = [];
  }

  ngOnInit()
  {
    const login = this.aroute.snapshot.params["login_42"];
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
            this.matches.unshift(matchInfo);
          }
        );
      });
      this.service.getIfFriends(this.profile.login_42).subscribe(res => {
        this.isFriend = res;
      });
    });
  }

  AddFriend()
  {
    this.service.addFriend(this.profile.login_42).subscribe(res => {
      this.isFriend = true;
    });
  }

  RemoveFriend()
  {
    this.service.removeFriend(this.profile.login_42).subscribe(res => {
      this.isFriend = false;
    });
  }
}