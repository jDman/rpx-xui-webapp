import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { cold, hot } from 'jasmine-marbles';
import { of } from 'rxjs';
import { Go } from '../../../app/store';
import { hearingActualsMainModel } from '../../hearing.test.data';
import { HearingsService } from '../../services/hearings.service';
import * as hearingActualsActions from '../actions/hearing-actuals.action';
import { HearingActualsEffects } from './hearing-actuals.effects';
import { HearingListEffects } from './hearing-list.effects';

describe('Hearing Actuals Effects', () => {
  let actions$;
  let effects: HearingActualsEffects;
  const hearingsServiceMock = jasmine.createSpyObj('HearingsService', [
    'getHearingActuals',
  ]);
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HearingsService,
          useValue: hearingsServiceMock,
        },
        HearingActualsEffects,
        provideMockActions(() => actions$)
      ]
    });
    effects = TestBed.get(HearingActualsEffects);
  });

  describe('loadHearingActual$', () => {
    it('should return a response with service hearing actuals', () => {
      hearingsServiceMock.getHearingActuals.and.returnValue(of(hearingActualsMainModel));
      const action = new hearingActualsActions.GetHearingActuals('1111222233334444');
      const completion = new hearingActualsActions.GetHearingActualsSuccess(hearingActualsMainModel);
      actions$ = hot('-a', { a: action });
      const expected = cold('-b', { b: completion });
      expect(effects.getHearingActuals$).toBeObservable(expected);
    });
  });

  describe('handleError', () => {
    it('should handle 500', () => {
      const action$ = HearingListEffects.handleError({
        status: 500,
        message: 'error'
      });
      action$.subscribe(action => expect(action).toEqual(new Go({ path: ['/service-down'] })));
    });
  });
});