import { HearingActualsStateData } from '../../models/hearingActualsStateData.model';
import * as fromActions from '../actions';

export const initialHearingActualsState: HearingActualsStateData = {
  hearingActualsMainModel: null,
  lastError: null,
};

export function hearingActualsReducer(
  currentState = initialHearingActualsState,
  action: fromActions.HearingActualsAction
): HearingActualsStateData {
  switch (action.type) {
    case fromActions.RESET_HEARING_ACTUALS: {
      return {
        ...initialHearingActualsState
      };
    }
    case fromActions.GET_HEARING_ACTUALS_SUCCESS: {
      return {
        ...currentState,
        hearingActualsMainModel: action.payload
      };
    }
    case fromActions.UPDATE_HEARING_ACTUALS: {
      return {
        ...currentState,
        hearingActualsMainModel: action.payload
      };
    }
    default: {
      return {
        ...currentState
      };
    }
  }
}

export const hearingActualsLastError = (hearingActualsState) => hearingActualsState.lastError;