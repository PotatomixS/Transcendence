import { Component, ElementRef, Input, SimpleChange, SimpleChanges } from '@angular/core';
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
    return true;
  }

  ngOnInit()
  {
    this.CodeForm.valueChanges.subscribe(values =>
      {
        this.onSubmit(values);
      });
  }
  
  onSubmit(values: any)
  {
    const Code: String = values.Code1 + values.Code2 + values.Code3 + values.Code4 + values.Code5 + values.Code6;
    if (values.Code1 && values.Code2 &&
      values.Code3 && values.Code4 &&
      values.Code5 && values.Code6)
      {
        document.getElementById("code1")?.blur();
        if (Code == "123456")
        {
          console.log("Success");
        }
        else
        {
          console.log("Failure");
          this.CodeForm.reset();
        }
        console.log(Code);
      }
    }

  onKeyDown(key: KeyboardEvent)
  {
    var values_list: Array<string | null | undefined>;
    var id_list: Array<string>;
  
    values_list = [this.CodeForm.value.Code1, this.CodeForm.value.Code2,
                   this.CodeForm.value.Code3, this.CodeForm.value.Code4,
                   this.CodeForm.value.Code5, this.CodeForm.value.Code6];
    id_list = ["code1", "code2", "code3",
               "code4", "code5", "code6"];
    if (key.key != "Backspace")
      return;
    for(var it = 0; it < 6; it++)
    {
      if (!values_list[it])
      {
        document.getElementById(id_list[it - 1])?.focus();
        return;
      }
    }
    document.getElementById(id_list[5])?.focus();
  }
  
  onInput(Input: InputEventInit)
  {
    var values_list: Array<string | null | undefined>;
    var id_list: Array<string>;
  
    values_list = [this.CodeForm.value.Code1, this.CodeForm.value.Code2,
                   this.CodeForm.value.Code3, this.CodeForm.value.Code4,
                   this.CodeForm.value.Code5, this.CodeForm.value.Code6];
    id_list = ["code1", "code2", "code3",
               "code4", "code5", "code6"];
    for(var it = 0; it < 6; it++)
    {
      if (!values_list[it])
      {
        document.getElementById(id_list[it])?.focus();
        return;
      }
    }
    document.getElementById(id_list[5])?.focus();
  }

  onPaste(paste: ClipboardEvent)
  {
    const Code: String = String(paste.clipboardData?.getData('text'));
    this.CodeForm.setValue({
      Code1: Code[0],
      Code2: Code[1],
      Code3: Code[2],
      Code4: Code[3],
      Code5: Code[4],
      Code6: Code[5],
    });
  }
}
