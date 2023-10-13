import { Component, Input, SimpleChange, SimpleChanges } from '@angular/core';
import { SharedService } from '../services/shared-service/shared.service';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent
{
  CodeForm = new FormGroup({
    Code1: new FormControl(''),
    Code2: new FormControl(''),
    Code3: new FormControl(''),
    Code4: new FormControl(''),
    Code5: new FormControl(''),
    Code6: new FormControl('')
  });

  
  constructor(public ss: SharedService)
  {

  }

  ft_2FA(): boolean
  {
    //cuando le doy al boton me comprueba que tengo token y que el usuario
    //tiene activada la 2FA y si se cumplen las dos cosas cambia LoginButton
    //a false y AuthCodeForm a true
    return false;
  }

  ngOnInit(changes: SimpleChanges)
  {
    this.onSubmit();
  }
  
  onSubmit()
  {
      console.log((this.CodeForm.value).Code1);
      if (this.CodeForm.value.Code1 && this.CodeForm.value.Code2 &&
        this.CodeForm.value.Code3 && this.CodeForm.value.Code4 &&
        this.CodeForm.value.Code5 && this.CodeForm.value.Code6)
      {

      }
  }
}
