import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Person } from '@hmcts/rpx-xui-common-lib/lib/models/person.model';
import { select, Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { $enum as EnumUtil } from 'ts-enum-util';
import { AppUtils } from '../../../../app/app-utils';
import { UserRole } from '../../../../app/models';
import * as fromAppStore from '../../../../app/store';
import { UserType } from '../../../../cases/models/user-type';
import {
  checkAnswersVisibilityStates,
  chooseAllocateToVisibilityStates,
  chooseDurationVisibilityStates,
  chooseRoleVisibilityStates,
  searchPersonVisibilityStates
} from '../../../constants/allocate-role-page-visibility-states';
import {
  Actions,
  AllocateRoleNavigation,
  AllocateRoleNavigationEvent,
  AllocateRoleState,
  AllocateRoleStateData,
  AllocateTo,
  DurationOfRole,
  Role,
  TypeOfRole
} from '../../../models';
import { AllocateRoleService } from '../../../services';
import * as fromFeature from '../../../store';
import { AllocateRoleCheckAnswersComponent } from '../allocate-role-check-answers/allocate-role-check-answers.component';
import { AllocateRoleSearchPersonComponent } from '../allocate-role-search-person/allocate-role-search-person.component';
import { ChooseAllocateToComponent } from '../choose-allocate-to/choose-allocate-to.component';
import { ChooseDurationComponent } from '../choose-duration/choose-duration.component';
import { ChooseRoleComponent } from '../choose-role/choose-role.component';

@Component({
  selector: 'exui-allocate-role-home',
  templateUrl: './allocate-role-home.component.html',
})
export class AllocateRoleHomeComponent implements OnInit, OnDestroy {

  @ViewChild('chooseRole', {read: ChooseRoleComponent})
  public chooseRoleComponent: ChooseRoleComponent;

  @ViewChild('chooseAllocateTo', {read: ChooseAllocateToComponent})
  public chooseAllocateToComponent: ChooseAllocateToComponent;

  @ViewChild('searchPerson', {read: AllocateRoleSearchPersonComponent})
  public searchPersonComponent: AllocateRoleSearchPersonComponent;

  @ViewChild('chooseDuration', {read: ChooseDurationComponent})
  public chooseDurationComponent: ChooseDurationComponent;

  @ViewChild('checkAnswers', {read: AllocateRoleCheckAnswersComponent})
  public checkAnswersComponent: AllocateRoleCheckAnswersComponent;

  public chooseRoleVisibilityStates = chooseRoleVisibilityStates;
  public chooseAllocateToVisibilityStates = chooseAllocateToVisibilityStates;
  public searchPersonVisibilityStates = searchPersonVisibilityStates;
  public chooseDurationVisibilityStates = chooseDurationVisibilityStates;
  public checkAnswersVisibilityStates = checkAnswersVisibilityStates;

  public navEvent: AllocateRoleNavigation;

  public appStoreSub: Subscription;
  public allocateRoleStateDataSub: Subscription;

  public navigationCurrentState: AllocateRoleState;
  public allocateTo: AllocateTo;
  public assignmentId: string;
  public caseId: string;
  public isLegalOpsOrJudicialRole: UserRole;

  public userType: string;
  public userIdToBeRemoved: string;
  public userNameToBeRemoved: string;
  public typeOfRole: string;
  public action: string;

  constructor(private readonly appStore: Store<fromAppStore.State>,
              private readonly store: Store<fromFeature.State>,
              private readonly allocateRoleService: AllocateRoleService,
              private readonly route: ActivatedRoute,
              private readonly router: Router) {
    if (this.route.snapshot.queryParams) {
      this.caseId = this.route.snapshot.queryParams.caseId ? this.route.snapshot.queryParams.caseId : null;
      this.assignmentId = this.route.snapshot.queryParams.assignmentId ? this.route.snapshot.queryParams.assignmentId : null;
      this.userType = this.route.snapshot.queryParams.userType ? this.route.snapshot.queryParams.userType : null;
      this.userIdToBeRemoved = this.route.snapshot.queryParams.actorId ? this.route.snapshot.queryParams.actorId : null;
      this.userNameToBeRemoved = this.route.snapshot.queryParams.userName ? this.route.snapshot.queryParams.userName : null;
      this.typeOfRole = this.route.snapshot.queryParams.typeOfRole ? this.route.snapshot.queryParams.typeOfRole : null;
      this.action = this.route.snapshot.routeConfig.path ? this.route.snapshot.routeConfig.path : null;
    }
    if (this.action === Actions.Reallocate) {
      this.instantiateReallocateRoleData();
    } else {
      this.store.dispatch(new fromFeature.AllocateRoleSetCaseId(this.caseId));
    }
  }

  private instantiateReallocateRoleData(): void {
    const personToBeRemoved: Person = {id: this.userIdToBeRemoved, name: this.userNameToBeRemoved, domain: this.userType};
    const allocateRoleState: AllocateRoleStateData = {
      caseId: this.caseId,
      assignmentId: this.assignmentId,
      state: AllocateRoleState.SEARCH_PERSON,
      typeOfRole: TypeOfRole[EnumUtil(TypeOfRole).getKeyOrDefault(this.typeOfRole)],
      allocateTo: AllocateTo.REALLOCATE_TO_ANOTHER_PERSON,
      personToBeRemoved,
      person: null,
      durationOfRole: DurationOfRole.INDEFINITE,
      action: Actions.Reallocate,
      period: null,
      lastError: null
    };
    this.store.dispatch(new fromFeature.AllocateRoleInstantiate(allocateRoleState));
  }

  public ngOnInit(): void {
    this.appStoreSub = this.appStore.pipe(select(fromAppStore.getUserDetails)).subscribe(
      userDetails => {
        this.isLegalOpsOrJudicialRole = AppUtils.isLegalOpsOrJudicial(userDetails.userInfo.roles);
      }
    );
    this.allocateRoleStateDataSub = this.store.pipe(select(fromFeature.getAllocateRoleState)).subscribe(
      allocateRoleStateData => {
        this.navigationCurrentState = allocateRoleStateData.state;
        this.allocateTo = allocateRoleStateData.allocateTo;
        this.action = allocateRoleStateData.action;
      }
    );
  }

  public isComponentVisible(currentNavigationState: AllocateRoleState, requiredNavigationState: AllocateRoleState[]): boolean {
    return requiredNavigationState.includes(currentNavigationState);
  }

  public onNavEvent(event: AllocateRoleNavigationEvent): void {
    this.navEvent = {
      event,
      timestamp: Date.now()
    };
    this.navigationHandler(event);
  }

  public navigationHandler(navEvent: AllocateRoleNavigationEvent): void {
    switch (navEvent) {
      case AllocateRoleNavigationEvent.BACK: {
        switch (this.navigationCurrentState) {
          case AllocateRoleState.CHOOSE_ALLOCATE_TO:
            this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.CHOOSE_ROLE));
            break;
          case AllocateRoleState.SEARCH_PERSON:
            switch (this.userType) {
              case UserType.JUDICIAL:
                switch (this.isLegalOpsOrJudicialRole) {
                  case UserRole.LegalOps:
                    this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.CHOOSE_ROLE));
                    break;
                  case UserRole.Judicial:
                    this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.CHOOSE_ALLOCATE_TO));
                    break;
                  default:
                    throw new Error('Invalid user role');
                }
                break;
              case UserType.LEGAL_OPS:
                switch (this.isLegalOpsOrJudicialRole) {
                  case UserRole.LegalOps:
                    this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.CHOOSE_ALLOCATE_TO));
                    break;
                  case UserRole.Judicial:
                    this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.CHOOSE_ROLE));
                    break;
                  default:
                    throw new Error('Invalid user role');
                }
                break;
              default:
                throw new Error('Invalid user type');
            }
            break;
          case AllocateRoleState.CHOOSE_DURATION:
            switch (this.action) {
              case Actions.Reallocate:
                this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.SEARCH_PERSON));
                break;
              case Actions.Allocate:
                switch (this.userType) {
                  case UserType.LEGAL_OPS:
                    switch (this.isLegalOpsOrJudicialRole) {
                      case UserRole.LegalOps:
                        switch (this.allocateTo) {
                          case AllocateTo.RESERVE_TO_ME:
                            this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.CHOOSE_ALLOCATE_TO));
                            break;
                          case AllocateTo.ALLOCATE_TO_ANOTHER_PERSON:
                            this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.SEARCH_PERSON));
                            break;
                          default:
                            throw new Error('Invalid allocate to');
                        }
                        break;
                      case UserRole.Judicial:
                        this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.SEARCH_PERSON));
                        break;
                      default:
                        throw new Error('Invalid user role');
                    }
                    break;
                  case UserType.JUDICIAL:
                    switch (this.allocateTo) {
                      case AllocateTo.RESERVE_TO_ME:
                        this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.CHOOSE_ALLOCATE_TO));
                        break;
                      case AllocateTo.ALLOCATE_TO_ANOTHER_PERSON:
                        this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.SEARCH_PERSON));
                        break;
                      default:
                        throw new Error('Invalid allocate to');
                    }
                    break;
                  default:
                    throw new Error('Invalid user type');
                }
                break;
              default:
                throw new Error('Invalid action');
            }
            break;
          case AllocateRoleState.CHECK_ANSWERS:
            this.store.dispatch(new fromFeature.AllocateRoleChangeNavigation(AllocateRoleState.CHOOSE_DURATION));
            break;
          default:
          throw new Error('Invalid allocation state');
        }
        break;
      }
      case AllocateRoleNavigationEvent.CONTINUE: {
        switch (this.navigationCurrentState) {
          case AllocateRoleState.CHOOSE_ROLE:
            this.chooseRoleComponent.navigationHandler(navEvent, this.userType, this.isLegalOpsOrJudicialRole);
            break;
          case AllocateRoleState.CHOOSE_ALLOCATE_TO:
            this.chooseAllocateToComponent.navigationHandler(navEvent);
            break;
          case AllocateRoleState.SEARCH_PERSON:
            this.searchPersonComponent.navigationHandler(navEvent);
            break;
          case AllocateRoleState.CHOOSE_DURATION:
            this.chooseDurationComponent.navigationHandler(navEvent);
            break;
          case AllocateRoleState.CHECK_ANSWERS:
            this.checkAnswersComponent.navigationHandler(navEvent);
            break;
          default:
            throw new Error('Invalid allocation state');
        }
        break;
      }
      case AllocateRoleNavigationEvent.CONFIRM: {
        switch (this.navigationCurrentState) {
          case AllocateRoleState.CHECK_ANSWERS:
            this.checkAnswersComponent.navigationHandler(navEvent);
            break;
          default:
            throw new Error('Invalid allocation state');
        }
        break;
      }
      case AllocateRoleNavigationEvent.CANCEL: {
        this.router.navigateByUrl(`cases/case-details/${this.caseId}/roles-and-access`);
        break;
      }
      default:
        throw new Error('Invalid allocation navigation event');
    }
  }

  private getSpecificRoles(roles: Role[], userRole: string): Role[] {
    return roles.filter(role => role.roleType === userRole);
  }

  public ngOnDestroy(): void {
    if (this.appStoreSub) {
      this.appStoreSub.unsubscribe();
    }
    if (this.allocateRoleStateDataSub) {
      this.allocateRoleStateDataSub.unsubscribe();
    }
    this.store.dispatch(new fromFeature.AllocateRoleReset());
  }
}