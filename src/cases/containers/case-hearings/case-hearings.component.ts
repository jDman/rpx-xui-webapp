import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserRole } from '../../../app/models/user-details.model';
import { RoleCategoryMappingService } from '../../../app/services/role-category-mapping/role-category-mapping.service';
import * as fromAppStore from '../../../app/store';
import { CaseHearingModel } from '../../../hearings/models/caseHearing.model';
import { Actions, HearingsSectionStatusEnum } from '../../../hearings/models/hearings.enum';
import * as fromHearingStore from '../../../hearings/store';

@Component({
  selector: 'exui-case-hearings',
  templateUrl: './case-hearings.component.html'
})
export class CaseHearingsComponent implements OnInit {

  public upcomingHearings$: Observable<CaseHearingModel[]>;
  public upcomingStatus: HearingsSectionStatusEnum = HearingsSectionStatusEnum.UPCOMING;
  public pastAndCancelledHearings$: Observable<CaseHearingModel[]>;
  public pastAndCancelledStatus: HearingsSectionStatusEnum = HearingsSectionStatusEnum.PAST_AND_CANCELLED;
  public hearingsActions: Actions[] = [Actions.Read];
  public userRoles: Observable<string[]>;
  public hasRequestAction: boolean = false;

  constructor(private readonly appStore: Store<fromAppStore.State>,
              private readonly hearingStore: Store<fromHearingStore.State>,
              private readonly activatedRoute: ActivatedRoute,
              private readonly roleCategoryMappingService: RoleCategoryMappingService) {
    const caseID = this.activatedRoute.snapshot.params.cid;
    this.userRoles = this.appStore.pipe(select(fromAppStore.getUserDetails)).pipe(
      map(userDetails => userDetails.userInfo.roles)
    );
    this.hearingStore.dispatch(new fromHearingStore.LoadAllHearings(caseID));
  }

  public ngOnInit(): void {
    this.getHearsListByStatus(HearingsSectionStatusEnum.UPCOMING).subscribe(hearings => {
      this.upcomingHearings$ = of(hearings.sort((a, b) => {
        return new Date(a.lastResponseReceivedDateTime) > new Date(b.lastResponseReceivedDateTime) ? 1 : -1;
      }).sort((a, b) => {
        return new Date(a.creationDateTime) > new Date(b.creationDateTime) ? 1 : -1;
      }).sort((a) => {
        return a.hearingListingStatus === 'WAITING TO BE LISTED' ? -1 : 1;
      }));
    });

    this.getHearsListByStatus(HearingsSectionStatusEnum.PAST_AND_CANCELLED).subscribe(hearings => {
      this.pastAndCancelledHearings$ = of(hearings.sort((a, b) => {
        return new Date(a.lastResponseReceivedDateTime) > new Date(b.lastResponseReceivedDateTime) ? 1 : -1;
      }).sort((a) => {
        return !a.lastResponseReceivedDateTime ? 1 : -1;
      }).sort((a, b) => {
        return new Date(a.creationDateTime) < new Date(b.creationDateTime) ? 1 : -1;
      }).sort((a, b) => {
        return new Date(a.creationDateTime) < new Date(b.creationDateTime) ? 1 : -1;
      }).sort((a) => {
        return a.lastResponseReceivedDateTime ? 1 : -1;
      }));
    });

    this.roleCategoryMappingService.isJudicialOrLegalOpsCategory(this.userRoles).subscribe(
      userRole => {
        if (userRole === UserRole.LegalOps) {
          this.hearingsActions = [...this.hearingsActions, Actions.Create, Actions.Update, Actions.Delete];
        }
      }
    );
    if (this.hearingsActions.includes(Actions.Create)) {
      this.hasRequestAction = true;
    }
  }

  public getHearsListByStatus(status: string): Observable<CaseHearingModel[]> {
    return this.hearingStore.pipe(select(fromHearingStore.getHearingsList)).pipe(
      map(hearingsStateData => {          
          if (hearingsStateData && hearingsStateData.caseHearingsMainModel && hearingsStateData.caseHearingsMainModel.caseHearings) {
            return hearingsStateData.caseHearingsMainModel.caseHearings.filter(hearing =>
              hearing.hmcStatus === status
            );
          } else {
            return [];
          }
        }
      )  
    );
  }
}