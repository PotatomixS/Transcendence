import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { PongPageComponent } from './pong-page/pong-page.component';
import { LoginComponent } from './login/login.component';
import { OtherProfilePageComponent } from './otherprofile-page/otherprofile-page.component';
import { AdminPageComponent } from './admin-page/admin-page.component';

const routes: Routes = [
  {path: 'profile', component: ProfilePageComponent},
  {path: 'pong', component: PongPageComponent},
  {path: 'pong/:watch', component: PongPageComponent},
  {path: 'otherprofile/:login_42', component: OtherProfilePageComponent},
  {path: 'admin', component: AdminPageComponent},
  {path: '', redirectTo: '/pong', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
