import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartProcess } from './start-process';

describe('StartProcess', () => {
  let component: StartProcess;
  let fixture: ComponentFixture<StartProcess>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartProcess],
    }).compileComponents();

    fixture = TestBed.createComponent(StartProcess);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
