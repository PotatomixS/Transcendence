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
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { InterceptorService,AuthService } from './services/auth-service/auth.service';
import { ProfileService } from './services/profile-service/profile.service';
import { OtherProfilePageComponent } from './otherprofile-page/otherprofile-page.component';
import { LoadingPageComponent } from './loading-page/loading-page.component';
import { AdminPageComponent } from './admin-page/admin-page.component';

@NgModule({
  declarations: [ AppComponent, LoginComponent, MainPageHeaderComponent, ProfilePageComponent, OtherProfilePageComponent, MainPageChatComponent, PongPageComponent, LoadingPageComponent, AdminPageComponent ],
  imports: [ BrowserModule, AppRoutingModule, ReactiveFormsModule, HttpClientModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: InterceptorService,
      multi: true
    },
    AuthService,
    ProfileService
  ],
  bootstrap: [AppComponent]
})
export class AppModule 
{

}
