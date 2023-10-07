import { Injectable, EventEmitter, Input, Output } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedService
{
  ShowLogin: boolean;
  UserName: string;
  ProfilePic: string;
  @Output() ShowLoginEmitter = new EventEmitter<boolean>();
  @Output() UserNameEmitter = new EventEmitter<string>();
  @Output() ProfilePicEmitter = new EventEmitter<string>();


  constructor()
  {
    this.ShowLogin = true;
    this.UserName = "UserName";
    this.ProfilePic = "../../assets/default_user_logo.png";
  }

  EmitShowLogin()
  {
    this.ShowLoginEmitter.emit(this.ShowLogin)
  }

  EmitUserName(): string
  {
    return this.UserName;
  }

  EmitProfilePic(): string
  {
    return this.ProfilePic;
  }



}
