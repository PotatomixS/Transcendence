import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class PongService {

  constructor() { }
}
