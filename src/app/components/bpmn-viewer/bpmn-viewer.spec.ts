import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpmnViewer } from './bpmn-viewer';

describe('BpmnViewer', () => {
  let component: BpmnViewer;
  let fixture: ComponentFixture<BpmnViewer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BpmnViewer],
    }).compileComponents();

    fixture = TestBed.createComponent(BpmnViewer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
