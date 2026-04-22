import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TacheForm } from './tache-form';

describe('TacheForm', () => {
  let component: TacheForm;
  let fixture: ComponentFixture<TacheForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TacheForm],
    }).compileComponents();

    fixture = TestBed.createComponent(TacheForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
