import {HearingListStateData} from '../../models/hearingListStateData.model';
import * as fromActions from '../actions';

export const initialHearingListState: HearingListStateData = {
  hearingListMainModel: null,
  lastError: null,
};

export function hearingListReducer(currentState = initialHearingListState,
                                   action: fromActions.HearingListAction): HearingListStateData {
  switch (action.type) {
    case fromActions.HEARING_LIST_RESET: {
      return {
        ...initialHearingListState
      };
    }
    case fromActions.LOAD_ALL_HEARINGS_SUCCESS: {
      return {
        ...currentState,
        hearingListMainModel: action.payload
      };
    }
    default: {
      return {
        ...currentState
      };
    }
  }
}

export const hearingListLastError = (hearingListState) => hearingListState.lastError;