import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { HearingCategory } from '../models/hearings.enum';
import { LovRefDataModel } from '../models/lovRefData.model';
import { LovRefDataService } from '../services/lov-ref-data.service';
import * as fromHearingStore from '../store';
import { RefDataResolver } from './ref-data-resolver.resolve';

@Injectable({
  providedIn: 'root'
})
export class HearingActualPartyChannelResolverService extends RefDataResolver implements Resolve<LovRefDataModel[]> {

  constructor(
    protected readonly lovRefDataService: LovRefDataService,
    protected readonly hearingStore: Store<fromHearingStore.State>,
    protected readonly router: Router
  ) {
    super(lovRefDataService, hearingStore, router);
  }

  public resolve(route?: ActivatedRouteSnapshot): Observable<LovRefDataModel[]> {
    route.data = {
      ...route.data,
      category: HearingCategory.PartyChannel
    };

    return super.resolve(route);
  }
}