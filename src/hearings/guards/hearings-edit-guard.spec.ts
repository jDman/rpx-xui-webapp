import { Router } from '@angular/router';
import { FeatureToggleService } from '@hmcts/rpx-xui-common-lib';
import { Store } from '@ngrx/store';
import {cold} from 'jasmine-marbles';
import { of } from 'rxjs';
import {UserDetails, UserRole} from '../../app/models';
import {SessionStorageService} from '../../app/services';
import {RoleCategoryMappingService} from '../../app/services/role-category-mapping/role-category-mapping.service';
import * as fromAppStore from '../../app/store';
import {HearingsEditGuard} from './hearings-edit-guard';

describe('HearingsEditGuard', () => {
  const USER_1: UserDetails = {
    canShareCases: true,
    sessionTimeout: {
      idleModalDisplayTime: 10,
      totalIdleTime: 50
    },
    userInfo: {
      id: '41a90c39-d756-4eba-8e85-5b5bf56b31f5',
      forename: 'Luke',
      surname: 'Wilson',
      email: 'lukesuperuserxui@mailnesia.com',
      active: true,
      roles: [
        'caseworker',
        'caseworker-sscs',
      ],
    }
  };
  const USER_2: UserDetails = {
    canShareCases: true,
    sessionTimeout: {
      idleModalDisplayTime: 10,
      totalIdleTime: 50
    },
    userInfo: {
      id: '41a90c39-d756-4eba-8e85-5b5bf56b31f5',
      forename: 'Luke',
      surname: 'Wilson',
      email: 'lukesuperuserxui@mailnesia.com',
      active: true,
      roles: [
        'caseworker',
        'caseworker-sscs-judge',
      ],
    }
  };

  const FEATURE_FLAG = [
    {
      jurisdiction: 'SSCS',
      roles: [
        'caseworker-sscs',
        'caseworker-sscs-judge'
      ]
    }
  ];

  const CASE_INFO = {cid: '1546518523959179', caseType: 'Benefit', jurisdiction: 'SSCS'};

  let hearingsEditGuard: HearingsEditGuard;
  let routerMock: jasmine.SpyObj<Router>;
  let storeMock: jasmine.SpyObj<Store<fromAppStore.State>>;
  let sessionStorageMock: jasmine.SpyObj<SessionStorageService>;
  let featureToggleMock: jasmine.SpyObj<FeatureToggleService>;
  let roleCategoryMappingServiceMock: jasmine.SpyObj<RoleCategoryMappingService>;

  beforeEach(() => {
    routerMock = jasmine.createSpyObj<Router>('router', ['navigate']);
    storeMock = jasmine.createSpyObj<Store<fromAppStore.State>>('store', ['pipe']);
    sessionStorageMock = jasmine.createSpyObj<SessionStorageService>('sessionStorageService', ['getItem']);
    featureToggleMock = jasmine.createSpyObj<FeatureToggleService>('featureToggleService', ['getValueOnce']);
    roleCategoryMappingServiceMock = jasmine.createSpyObj<RoleCategoryMappingService>('roleCategoryMappingService', ['getUserRoleCategory']);
  });

  it('case worker should be able to access the hearings edit link', () => {
    storeMock.pipe.and.returnValue(of(USER_1));
    roleCategoryMappingServiceMock.getUserRoleCategory.and.returnValue(of(UserRole.LegalOps));
    featureToggleMock.getValueOnce.and.returnValue(of(FEATURE_FLAG));
    sessionStorageMock.getItem.and.returnValue(JSON.stringify(CASE_INFO));
    hearingsEditGuard = new HearingsEditGuard(storeMock, sessionStorageMock, featureToggleMock, roleCategoryMappingServiceMock, routerMock);
    const result$ = hearingsEditGuard.canActivate();
    const canActive = true;
    const expected = cold('(b|)', {b: canActive});
    expect(result$).toBeObservable(expected);
  });

  it('judicial user should not be able to access the hearings edit link', () => {
    storeMock.pipe.and.returnValue(of(USER_2));
    roleCategoryMappingServiceMock.getUserRoleCategory.and.returnValue(of(UserRole.Judicial));
    featureToggleMock.getValueOnce.and.returnValue(of(FEATURE_FLAG));
    sessionStorageMock.getItem.and.returnValue(JSON.stringify(CASE_INFO));
    hearingsEditGuard = new HearingsEditGuard(storeMock, sessionStorageMock, featureToggleMock, roleCategoryMappingServiceMock, routerMock);
    const result$ = hearingsEditGuard.canActivate();
    const canActive = false;
    const expected = cold('(b|)', {b: canActive});
    expect(result$).toBeObservable(expected);
  });

});