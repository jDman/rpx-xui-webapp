import {APP_BASE_HREF} from '@angular/common';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {inject, TestBed} from '@angular/core/testing';
import {ActivatedRouteSnapshot} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {provideMockStore} from '@ngrx/store/testing';
import {of} from 'rxjs';
import {initialState} from '../hearing.test.data';
import {LovRefDataModel} from '../models/lovRefData.model';
import {LovRefDataService} from '../services/lov-ref-data.service';
import {HearingStageResolver} from './hearing-stage.resolver';

describe('HearingStage Resolver', () => {
  let lovRefDataService: LovRefDataService;
  const dataRef: LovRefDataModel[] = [];

  beforeEach(() => {
    TestBed.configureTestingModule({
        imports: [
          RouterTestingModule.withRoutes([]),
          HttpClientTestingModule,
        ],
        providers: [
          provideMockStore({initialState}),
          HearingStageResolver,
          LovRefDataService,
          {provide: APP_BASE_HREF, useValue: '/'}
        ]
      }
    );
    lovRefDataService = TestBed.get(LovRefDataService) as LovRefDataService;
  });

  it('should be created', () => {
    const service: HearingStageResolver = TestBed.get(HearingStageResolver);
    expect(service).toBeTruthy();
  });

  it('resolves reference data for the hearing stage', inject([HearingStageResolver], (service: HearingStageResolver) => {
    spyOn(lovRefDataService, 'getListOfValues').and.returnValue(of(dataRef));
    spyOn(service, 'getReferenceData$').and.callThrough();
    const route = new ActivatedRouteSnapshot();
    route.data = {
      title: 'HMCTS Hearings | Request Hearing | Hearing Stage'
    };
    service.resolve(route).subscribe((refData: LovRefDataModel[]) => {
      expect(service.getReferenceData$).toHaveBeenCalled();
      expect(lovRefDataService.getListOfValues).toHaveBeenCalled();
      expect(refData).toEqual([]);
    });
  }));
});