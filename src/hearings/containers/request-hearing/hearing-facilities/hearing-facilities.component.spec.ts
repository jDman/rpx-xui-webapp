import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute} from '@angular/router';
import {provideMockStore} from '@ngrx/store/testing';
import {of} from 'rxjs';
import {ACTION} from '../../../models/hearings.enum';
import {HearingsService} from '../../../services/hearings.service';
import {initialState} from '../hearing.store.state.test';
import {HearingFacilitiesComponent} from './hearing-facilities.component';

describe('HearingFacilitiesComponent', () => {
  let component: HearingFacilitiesComponent;
  let fixture: ComponentFixture<HearingFacilitiesComponent>;
  const mockedHttpClient = jasmine.createSpyObj('HttpClient', ['get', 'post']);
  const hearingsService = new HearingsService(mockedHttpClient);
  hearingsService.navigateAction$ = of(ACTION.CONTINUE);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HearingFacilitiesComponent],
      providers: [
        provideMockStore({initialState}),
        {provide: HearingsService, useValue: hearingsService},
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                caseFlags: null,
              },
            },
          },
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HearingFacilitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    fixture.destroy();
  });
});