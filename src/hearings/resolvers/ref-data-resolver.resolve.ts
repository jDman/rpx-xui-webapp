import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { HearingCategory } from '../models/hearings.enum';
import { LovRefDataModel } from '../models/lovRefData.model';
import { LovRefDataService } from '../services/lov-ref-data.service';
import * as fromHearingStore from '../store';

@Injectable({
  providedIn: 'root'
})
export class RefDataResolver implements Resolve<LovRefDataModel[]> {
  public serviceId: string = '';

  constructor(
    protected readonly lovRefDataService: LovRefDataService,
    protected readonly hearingStore: Store<fromHearingStore.State>,
    protected readonly router: Router
  ) { }

  public resolve(route?: ActivatedRouteSnapshot): Observable<LovRefDataModel[]> {
    return this.getServiceId$()
      .pipe(
        switchMap(id => {
          return of(
            id ? id : this.serviceId);
        }), take(1),
        switchMap((serviceId) => {
          const category = route.data['category'] ? route.data['category'] as HearingCategory : HearingCategory.Priority;
          return this.getReferenceData$(serviceId, category, route.data.isChildRequired && route.data.isChildRequired.includes(route.data['category']));
        })
      );
  }

  public getServiceId$(): Observable<string> {
    return this.hearingStore.pipe(select(fromHearingStore.getHearingList)).pipe(
      map(hearingList => hearingList && hearingList.hearingListMainModel ? hearingList.hearingListMainModel.hmctsServiceID : '')
    );
  }

  public getReferenceData$(serviceId, category: HearingCategory, isChildRequired): Observable<LovRefDataModel[]> {
    return this.lovRefDataService.getListOfValues(category, serviceId, isChildRequired).pipe(
      catchError(() => {
        this.router.navigate(['/hearings/error']);
        return of(null);
      })
    );
  }
}