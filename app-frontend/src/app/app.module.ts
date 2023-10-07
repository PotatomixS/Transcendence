import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { MainPageHeaderComponent } from './main-page-header/main-page-header.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { MainPageChatComponent } from './main-page-chat/main-page-chat.component';
import { PongPageComponent } from './pong-page/pong-page.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedService } from './shared.service';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [ AppComponent, LoginComponent, MainPageHeaderComponent, ProfilePageComponent, MainPageChatComponent, PongPageComponent ],
  imports: [ BrowserModule, AppRoutingModule, ReactiveFormsModule, HttpClientModule],
  providers: [SharedService],
  bootstrap: [AppComponent]
})
export class AppModule 
{

}
