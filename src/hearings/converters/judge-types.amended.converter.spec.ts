import {cold} from 'jasmine-marbles';
import {of} from 'rxjs';
import {initialState} from '../hearing.test.data';
import {State} from '../store/reducers';
import { JudgeTypesAmendedConverter } from './judge-types.amended.converter';

describe('JudgeTypesAmendedConverter', () => {

  let judgeTypesAmendedConverter: JudgeTypesAmendedConverter;

  beforeEach(() => {
    judgeTypesAmendedConverter = new JudgeTypesAmendedConverter();
  });

  it('should transform judge type amended flag based on selection', () => {
    const STATE: State = initialState.hearings;
    STATE.hearingRequest.hearingRequestMainModel.hearingDetails.panelRequirements = {};
    STATE.hearingRequest.hearingRequestMainModel.hearingDetails.panelRequirements.roleType = ['tribunalJudge'];
    const result$ = judgeTypesAmendedConverter.transformIsAmended(of(STATE));
    const isAmended = true;
    const expected = cold('(b|)', {b: isAmended});
    expect(result$).toBeObservable(expected);
  });

});