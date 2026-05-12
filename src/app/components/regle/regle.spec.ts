import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Regle } from './regle';

describe('Regle', () => {
  let component: Regle;
  let fixture: ComponentFixture<Regle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Regle],
    }).compileComponents();

    fixture = TestBed.createComponent(Regle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
