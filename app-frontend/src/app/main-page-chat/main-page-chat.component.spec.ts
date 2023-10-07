import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainPageChatComponent } from './main-page-chat.component';

describe('MainPageChatComponent', () => {
  let component: MainPageChatComponent;
  let fixture: ComponentFixture<MainPageChatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MainPageChatComponent]
    });
    fixture = TestBed.createComponent(MainPageChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
