import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {Store} from '@ngrx/store';
import {provideMockStore} from '@ngrx/store/testing';
import {of} from 'rxjs';
import {initialState} from '../../hearing.test.data';
import {ACTION} from '../../models/hearings.enum';
import {HearingsService} from '../../services/hearings.service';
import * as fromHearingStore from '../../store';
import {AbstractPageFlow} from '../../utils/abstract-page-flow';
import {HearingActualsComponent} from './hearing-actuals.component';

describe('RequestHearingComponent', () => {
  let component: HearingActualsComponent;
  let fixture: ComponentFixture<HearingActualsComponent>;
  let mockStore: any;
  const mockPageFlow = jasmine.createSpyObj('PageFlow', ['getCurrentPage']);
  const mockedHttpClient = jasmine.createSpyObj('HttpClient', ['get', 'post']);
  const hearingsService = new HearingsService(mockedHttpClient);
  hearingsService.navigateAction$ = of(ACTION.CONTINUE);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [HearingActualsComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {provide: AbstractPageFlow, useValue: mockPageFlow},
        provideMockStore({initialState}),
        {provide: HearingsService, useValue: hearingsService},
      ]
    })
      .compileComponents();
    mockStore = TestBed.get(Store);
    fixture = TestBed.createComponent(HearingActualsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should check continue method', () => {
    spyOn(hearingsService, 'navigateAction');
    component.onBack();
    expect(hearingsService.navigateAction).toHaveBeenCalledWith(ACTION.BACK);
  });

  it('should check submit method', () => {
    spyOn(hearingsService, 'navigateAction');
    component.onSubmit();
    expect(hearingsService.navigateAction).toHaveBeenCalledWith(ACTION.SUBMIT);
  });


  afterEach(() => {
    fixture.destroy();
  });
});