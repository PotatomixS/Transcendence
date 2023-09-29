import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { MainPageHeaderComponent } from './main-page-header/main-page-header.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';

@NgModule({
  declarations: [ AppComponent, LoginComponent, MainPageHeaderComponent, ProfilePageComponent ],
  imports: [ BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
