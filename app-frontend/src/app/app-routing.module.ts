import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { PongPageComponent } from './pong-page/pong-page.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  {path: 'profile', component: ProfilePageComponent},
  {path: 'pong', component: PongPageComponent},
  {path: '', redirectTo: '/pong', pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
