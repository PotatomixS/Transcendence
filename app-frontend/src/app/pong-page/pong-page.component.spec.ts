import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PongPageComponent } from './pong-page.component';

describe('PongPageComponent', () => {
  let component: PongPageComponent;
  let fixture: ComponentFixture<PongPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PongPageComponent]
    });
    fixture = TestBed.createComponent(PongPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
