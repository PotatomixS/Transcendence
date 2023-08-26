import { Component } from '@angular/core';
import { Test, TestService } from './services/test-service/test.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app-frontend';

  testValue: Observable<Test> = this.service.getTest();

  constructor(private service: TestService) {

  }
}
