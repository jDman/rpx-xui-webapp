import {Component, CUSTOM_ELEMENTS_SCHEMA, Input} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {AbstractControl, FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {By} from '@angular/platform-browser';
import {ErrorMessage} from '@hmcts/ccd-case-ui-toolkit/dist/shared/domain';
import {SearchLocationComponent} from '@hmcts/rpx-xui-common-lib';
import {LocationByEPIMSModel} from '@hmcts/rpx-xui-common-lib/lib/models/location.model';
import {provideMockStore} from '@ngrx/store/testing';
import {ACTION} from '../../../models/hearings.enum';
import {HearingsService} from '../../../services/hearings.service';
import {initialState} from '../hearing.store.state.test';
import {HearingVenueComponent} from './hearing-venue.component';

@Component({
  selector: 'exui-hearing-parties-title',
  template: '',
})
class MockHearingPartiesComponent {
  @Input() public error: ErrorMessage;
}

class NativeElement {
  public focus() {
  }
}

class MockAutoCompleteInputBox {
  public nativeElement: NativeElement = new NativeElement();
}

@Component({
  selector: 'exui-search-location',
  template: '',
})
class MockLocationSearchContainerComponent {
  @Input() public serviceIds: string = '';
  @Input() public locationType: string = '';
  @Input() public disabled: boolean = false;
  @Input() public selectedLocations: LocationByEPIMSModel[];
  @Input() public submitted?: boolean = true;
  @Input() public control: AbstractControl;
  public autoCompleteInputBox: MockAutoCompleteInputBox = new MockAutoCompleteInputBox();
}

describe('HearingVenueComponent', () => {
  let component: HearingVenueComponent;
  let fixture: ComponentFixture<HearingVenueComponent>;
  const mockedHttpClient = jasmine.createSpyObj('HttpClient', ['get', 'post']);
  const hearingsService = new HearingsService(mockedHttpClient);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [HearingVenueComponent, MockLocationSearchContainerComponent, MockHearingPartiesComponent],
      providers: [
        provideMockStore({initialState}),
        {provide: HearingsService, useValue: hearingsService},
        FormBuilder
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HearingVenueComponent);
    component = fixture.componentInstance;
    component.selectedLocations = [{
      epims_id: '1',
      court_name: 'wolverhampton court',
      region: 'welsh'
    }] as LocationByEPIMSModel[];
    fixture.detectChanges();
    spyOn(component, 'removeSelection').and.callThrough();
    spyOn(component, 'reInitiateState').and.callThrough();
    spyOn(component, 'getLocationSearchFocus').and.callThrough();
    spyOn(component, 'appendLocation').and.callThrough();
    spyOn(component, 'prepareHearingRequestData').and.callThrough();
    spyOn(component, 'isFormValid').and.callThrough();
    component.searchLocationComponent = new MockLocationSearchContainerComponent() as unknown as SearchLocationComponent;
    spyOn(component.searchLocationComponent.autoCompleteInputBox.nativeElement, 'focus');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set hearingList.hearingListMainModel to SSCS', () => {
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.selectedLocations).toEqual([
        {
          epims_id: '123',
          court_name: 'test location',
          region: 'Wales',
        } as LocationByEPIMSModel
      ]);

      expect(component.reInitiateState).toHaveBeenCalled();
      expect(component.serviceIds).toEqual('SSCS');
    });
  });

  it('should call prepareHearingRequestData when executeAction is called with a valid form', () => {
    component.findLocationFormGroup.controls.locationSelectedFormControl.setValue(undefined);
    fixture.detectChanges();
    component.executeAction(ACTION.CONTINUE);
    expect(component.prepareHearingRequestData).toHaveBeenCalled();
  });

  it('should true when calling isFormValid with partyChannel', () => {
    component.findLocationFormGroup.controls.locationSelectedFormControl.setValue(undefined);
    fixture.detectChanges();
    const formValid = component.isFormValid();
    expect(formValid).toEqual(true);
  });

  it('should return false for isFormValid when a location is selected and not added', () => {
    const location: LocationByEPIMSModel = {
      epims_id: '123',
      court_name: 'Test Caurt Name',
      region: 'Wales'
    } as LocationByEPIMSModel;

    component.findLocationFormGroup.controls.locationSelectedFormControl.setValue(location);
    fixture.detectChanges();
    const formValid = component.isFormValid();
    expect(formValid).toEqual(false);
  });

  it('should return false for isLocationValid when locationSelectedformcontrol is not valid and is dirty', () => {
    component.findLocationFormGroup.controls.locationSelectedFormControl.setValue(undefined);
    component.findLocationFormGroup.controls.locationSelectedFormControl.markAsDirty();
    fixture.detectChanges();
    const formValid = component.isLocationValid();
    expect(component.findLocationFormGroup.controls.locationSelectedFormControl.errors.required).toBeTruthy();
    expect(formValid).toEqual(false);
  });

  it('should return true for isLocationValid when locationSelectedformcontrol is not valid and is dirty', () => {
    const location: LocationByEPIMSModel = {
      epims_id: '123',
      court_name: 'Test Caurt Name',
      region: 'Wales'
    } as LocationByEPIMSModel;

    component.findLocationFormGroup.controls.locationSelectedFormControl.setValue(location);
    component.findLocationFormGroup.controls.locationSelectedFormControl.markAsDirty();
    fixture.detectChanges();
    const result = component.isLocationValid();
    expect(component.validationErrors).toEqual([]);
    expect(result).toEqual(true);
  });


  it('should initialise component', async () => {
    expect(component).toBeDefined();
    component.ngOnInit();
    expect(component.getLocationSearchFocus).toHaveBeenCalled();
  });

  it('should display selection in selection list', async () => {
    const location = {
      court_venue_id: '100',
      epims_id: '219164',
      is_hearing_location: 'Y',
      is_case_management_location: 'Y',
      site_name: 'Aberdeen Tribunal Hearing Centre',
      court_name: 'ABERDEEN TRIBUNAL HEARING CENTRE',
      court_status: 'Open',
      region_id: '9',
      region: 'Scotland',
      court_type_id: '17',
      court_type: 'Employment Tribunal',
      open_for_public: 'Yes',
      court_address: 'AB1, 48 HUNTLY STREET, ABERDEEN',
      postcode: 'AB11 6LT'
    } as LocationByEPIMSModel;

    component.findLocationFormGroup.controls.locationSelectedFormControl.setValue(location);
    component.addSelection();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.selectedLocations.length).toBeGreaterThan(0);
      expect(component.findLocationFormGroup.controls.locationSelectedFormControl.value).toBeUndefined();
    });
  });

  it('should remove selection in selection list', async () => {
    const location = {
      court_venue_id: '100',
      epims_id: '219164',
      is_hearing_location: 'Y',
      is_case_management_location: 'Y',
      site_name: 'Aberdeen Tribunal Hearing Centre',
      court_name: 'ABERDEEN TRIBUNAL HEARING CENTRE',
      court_status: 'Open',
      region_id: '9',
      region: 'Scotland',
      court_type_id: '17',
      court_type: 'Employment Tribunal',
      open_for_public: 'Yes',
      court_address: 'AB1, 48 HUNTLY STREET, ABERDEEN',
      postcode: 'AB11 6LT'
    } as LocationByEPIMSModel;

    component.findLocationFormGroup.controls.locationSelectedFormControl.setValue(location);
    component.addSelection();
    fixture.detectChanges();
    expect(component.selectedLocations.length).toBe(2);
    component.removeSelection(location);
    expect(component.selectedLocations.length).toBe(1);
  });

  it('should show error when there is no locations found', async (done) => {
    const location = {
      court_venue_id: '100',
      epims_id: '219164',
      is_hearing_location: 'Y',
      is_case_management_location: 'Y',
      site_name: 'Aberdeen Tribunal Hearing Centre',
      court_name: 'ABERDEEN TRIBUNAL HEARING CENTRE',
      court_status: 'Open',
      region_id: '9',
      region: 'Scotland',
      court_type_id: '17',
      court_type: 'Employment Tribunal',
      open_for_public: 'Yes',
      court_address: 'AB1, 48 HUNTLY STREET, ABERDEEN',
      postcode: 'AB11 6LT'
    } as LocationByEPIMSModel;
    component.findLocationFormGroup.controls.locationSelectedFormControl.setValue(undefined);
    component.addSelection();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      done();
      const errorElement = fixture.debugElement.query(By.css('.govuk-error-summary'));
      expect(errorElement).toBeDefined();
    });

    component.selectedLocations = [location];
    component.removeSelection(location);
    fixture.detectChanges();
    expect(component.selectedLocations.length).toEqual(0);
  });

  it('should show summry header', async (done) => {
    component.findLocationFormGroup.controls.locationSelectedFormControl.setValue('TEST ERROR');
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      done();
      const errorElement = fixture.debugElement.query(By.css('.govuk-error-summary__list'));
      expect(errorElement).toEqual(null);
    });
  });

  it('should reset form control and set it pristine when appendLocation is called', () => {
    component.findLocationFormGroup.controls.locationSelectedFormControl.setValue('TEST ERROR');
    component.appendLocation([]);
    expect(component.findLocationFormGroup.controls.locationSelectedFormControl.pristine).toBeTruthy();
    expect(component.findLocationFormGroup.controls.locationSelectedFormControl.value).toEqual(undefined);
  });

  it('should call getLocationSearchFocus when clicking on the summary error anchor', async (done) => {
    component.findLocationFormGroup.controls.locationSelectedFormControl.setValue('TEST ERROR');
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      done();
      const errorElement = fixture.debugElement.query(By.css('.govuk-error-message'));
      expect(errorElement).toBeDefined();
      const errorAnchor = errorElement.nativeElement.nativeElement.querySelector('a');
      errorAnchor.dispatchEvent(new Event('click'));
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(component.getLocationSearchFocus).toHaveBeenCalled();
        expect(component.searchLocationComponent &&
          component.searchLocationComponent.autoCompleteInputBox &&
          component.searchLocationComponent.autoCompleteInputBox.nativeElement).toBeDefined();
        expect(component.searchLocationComponent.autoCompleteInputBox.nativeElement.focus).toHaveBeenCalled();
      });
    });
  });

  it('should include page elements', () => {
    const hearingHeader = fixture.debugElement.query(By.css('.govuk-heading-l'));
    expect(hearingHeader.nativeElement.innerText).toContain('What are the hearing venue details?');
    const hint = fixture.debugElement.query(By.css('.govuk-hint'));
    expect(hint.nativeElement.innerText).toContain('If this is a fully remote hearing you must still select the court or tribunal which will be managing the case.');
    const findCourtLink = fixture.debugElement.query(By.css('.govuk-inset-text'));
    expect(findCourtLink.nativeElement.innerText).toContain('You can check the venue has the required facilities or reasonable adjustments using');
  });

  it('should call auto complete focus', () => {
    component.getLocationSearchFocus();
    expect(component.searchLocationComponent &&
      component.searchLocationComponent.autoCompleteInputBox &&
      component.searchLocationComponent.autoCompleteInputBox.nativeElement).toBeDefined();
    expect(component.searchLocationComponent.autoCompleteInputBox.nativeElement.focus).toHaveBeenCalled();
  });

  afterEach(() => {
    fixture.destroy();
  });
});