import {Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {HearingLocationModel} from '../models/hearingLocation.model';
import {LocationByEPIMMSModel} from '../models/location.model';
import {LocationsDataService} from '../services/locations-data.service';
import {State} from '../store';
import {HiddenConverter} from './hidden.converter';

export class WelshHiddenConverter implements HiddenConverter {

  constructor(protected readonly locationsDataService: LocationsDataService) {
  }

  public transformHidden(hearingState$: Observable<State>): Observable<boolean> {
    return hearingState$.pipe(
      switchMap(state => {
      const hearingLocations: HearingLocationModel[] = state.hearingRequest.hearingRequestMainModel.hearingDetails.hearingLocations;
      const locationIds = hearingLocations.map(location => location.locationId).join(',');
      const locations$: Observable<LocationByEPIMMSModel[]> = this.locationsDataService.getLocationById(locationIds);
      return locations$.pipe(map(
        locations => {
          return !locations.some(location => location.region === 'Wales');
        })
      );
    }));
  }
}