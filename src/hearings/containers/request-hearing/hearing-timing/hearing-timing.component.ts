import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {ErrorMessagesModel, GovUiConfigModel} from '@hmcts/rpx-xui-common-lib/lib/gov-ui/models';
import {Store} from '@ngrx/store';
import * as moment from 'moment';
import * as fromHearingStore from '../../../../hearings/store';
import {
  ACTION,
  HearingDateEnum,
  HearingDatePriorityConstEnum,
  HearingDatePriorityEnum,
  RadioOptions
} from '../../../models/hearings.enum';
import { HearingWindowModel } from '../../../models/hearingWindow.model';
import {RefDataModel} from '../../../models/refData.model';
import {UnavailabilityRangeModel} from '../../../models/unavailabilityRange.model';
import {HearingsService} from '../../../services/hearings.service';
import {ValidatorsUtils} from '../../../utils/validators.utils';
import {RequestHearingPageFlow} from '../request-hearing.page.flow';

@Component({
  selector: 'exui-hearing-timing',
  templateUrl: './hearing-timing.component.html',
  styleUrls: ['./hearing-timing.component.scss']
})
export class HearingTimingComponent extends RequestHearingPageFlow implements OnInit, AfterViewInit, OnDestroy {
  public priorityForm: FormGroup;
  public priorities: RefDataModel[];
  public checkedHearingAvailability: string;
  public partiesNotAvailableDates: string[] = [];
  public firstHearingDate: GovUiConfigModel;
  public earliestHearingDate: GovUiConfigModel;
  public latestHearingDate: GovUiConfigModel;
  public validationErrors: { id: string, message: string }[] = [];
  public hearingLengthErrorValue: string;
  public hearingPriorityError: string;
  public hearingPriorityDateError: string;
  public firstDateOfHearingError: ErrorMessagesModel;
  public earliestDateOfHearingError: ErrorMessagesModel;
  public latestDateOfHearingError: ErrorMessagesModel;
  public priorityFormInfo: { hours: string, minutes: string, startDate: Date, firstDate: Date, secondDate: Date, priority: string };

  constructor(private readonly formBuilder: FormBuilder,
              protected readonly route: ActivatedRoute,
              private readonly validatorsUtils: ValidatorsUtils,
              protected readonly hearingStore: Store<fromHearingStore.State>,
              protected readonly hearingsService: HearingsService) {
    super(hearingStore, hearingsService, route);
  }

  public get firstHearingFormGroup(): FormGroup {
    return this.priorityForm.controls.firstHearing as FormGroup;
  }

  public get dateRangeHearingFormGroup(): FormGroup {
    return this.priorityForm.controls.dateRangeHearing as FormGroup;
  }

  public get earliestHearingFormGroup(): FormGroup {
    return this.dateRangeHearingFormGroup.controls.earliestHearing as FormGroup;
  }

  public get latestHearingFormGroup(): FormGroup {
    return this.dateRangeHearingFormGroup.controls.latestHearing as FormGroup;
  }

  public ngOnInit(): void {
    this.initDateConfig();
    this.getFormData();
    this.initForm();
    this.priorities = this.route.snapshot.data.hearingPriorities.sort((currentPriority: { order: number; }, nextPriority: { order: number; }) => (currentPriority.order < nextPriority.order ? -1 : 1));
    // @ts-ignore
    const unavailabilityDateList: UnavailabilityRangeModel[] = this.serviceHearingValuesModel.parties.flatMap(party => party.unavailabilityRanges);
    this.checkUnavailableDatesList(unavailabilityDateList);
  }

  public getFormData(): void {
    let duration: number;
    let hearingWindow: HearingWindowModel;
    let startDate: Date = null;
    let firstDate: Date = null;
    let secondDate: Date = null;
    let priority: string;
    duration = this.hearingRequestMainModel.hearingDetails.duration ?
      this.hearingRequestMainModel.hearingDetails.duration : 0;
    hearingWindow = this.hearingRequestMainModel.hearingDetails.hearingWindow;
    if (hearingWindow && hearingWindow.hearingWindowDateRange
      && hearingWindow.hearingWindowDateRange.hearingWindowStartDateRange && hearingWindow.hearingWindowDateRange.hearingWindowEndDateRange) {
      this.checkedHearingAvailability = RadioOptions.CHOOSE_DATE_RANGE;
      firstDate = new Date(hearingWindow.hearingWindowDateRange.hearingWindowStartDateRange);
      secondDate = new Date(hearingWindow.hearingWindowDateRange.hearingWindowEndDateRange);
    } else if (hearingWindow && hearingWindow.hearingWindowDateRange
      && hearingWindow.hearingWindowDateRange.hearingWindowStartDateRange && !hearingWindow.hearingWindowDateRange.hearingWindowEndDateRange) {
      this.checkedHearingAvailability = RadioOptions.YES;
      startDate = new Date(hearingWindow.hearingWindowDateRange.hearingWindowStartDateRange);
    } else if (hearingWindow) {
      this.checkedHearingAvailability = RadioOptions.NO;
    }
    priority = this.hearingRequestMainModel.hearingDetails.hearingPriorityType ?
      this.hearingRequestMainModel.hearingDetails.hearingPriorityType : '';
    this.priorityFormInfo = {
      hours: duration ? `${Math.floor(duration / 60)}` : '',
      minutes: duration ? `${duration % 60}` : '',
      firstDate, secondDate, priority, startDate
    };
  }

  public initDateConfig(): void {
    this.firstHearingDate = {
      id: 'firstHearingDate',
      name: 'firstHearingDate',
      hint: '',
      classes: 'govuk-fieldset__legend govuk-fieldset__legend--s',
      label: 'The first date of the hearing must be'
    };

    this.earliestHearingDate = {
      id: 'earliestHearingDate',
      name: 'earliestHearingDate',
      hint: '',
      classes: 'govuk-fieldset__legend govuk-fieldset__legend--s',
      label: 'Earliest hearing date'
    };
    this.latestHearingDate = {
      id: 'latestHearingDate',
      name: 'latestHearingDate',
      hint: '',
      classes: 'govuk-fieldset__legend govuk-fieldset__legend--s',
      label: 'Latest hearing date'
    };
  }

  public initForm(): void {
    this.priorityForm = this.formBuilder.group({
      durationLength: this.formBuilder.group({
        hours: [this.priorityFormInfo.hours, [this.validatorsUtils.numberMinMaxValidator(HearingDatePriorityConstEnum.MinHours, HearingDatePriorityConstEnum.MaxHours)]],
        minutes: [this.priorityFormInfo.minutes, [this.validatorsUtils.numberMultipleValidator(HearingDatePriorityConstEnum.MinutesMuliplier)]]
      }, { validator: this.validatorsUtils.minutesValidator(HearingDatePriorityConstEnum.TotalMinMinutes, HearingDatePriorityConstEnum.TotalMaxMinutes, HearingDatePriorityConstEnum.TotalMinutes) }),
      specificDate: [this.checkedHearingAvailability, Validators.required],
      firstHearing: this.formBuilder.group({
        firstHearingDate_day: [this.priorityFormInfo.startDate && this.priorityFormInfo.startDate.getDate()],
        firstHearingDate_month: [this.priorityFormInfo.startDate && this.priorityFormInfo.startDate.getMonth() + 1],
        firstHearingDate_year: [this.priorityFormInfo.startDate && this.priorityFormInfo.startDate.getFullYear()],
      }),
      dateRangeHearing: this.formBuilder.group({
        earliestHearing: this.formBuilder.group({
          earliestHearingDate_day: [this.priorityFormInfo.firstDate && this.priorityFormInfo.firstDate.getDate()],
          earliestHearingDate_month: [this.priorityFormInfo.firstDate && this.priorityFormInfo.firstDate.getMonth() + 1],
          earliestHearingDate_year: [this.priorityFormInfo.firstDate && this.priorityFormInfo.firstDate.getFullYear()],
        }),
        latestHearing: this.formBuilder.group({
          latestHearingDate_day: [this.priorityFormInfo.secondDate && this.priorityFormInfo.secondDate.getDate()],
          latestHearingDate_month: [this.priorityFormInfo.secondDate && this.priorityFormInfo.secondDate.getMonth() + 1],
          latestHearingDate_year: [this.priorityFormInfo.secondDate && this.priorityFormInfo.secondDate.getFullYear()],
        }),
      }),
      priority: [this.priorityFormInfo.priority, Validators.required]
    });
  }
  public showDateAvailability(): void {
    this.checkedHearingAvailability = this.priorityForm.controls.specificDate.value;
    this.firstHearingFormGroup.clearValidators();
    this.dateRangeHearingFormGroup.clearValidators();
    if (this.checkedHearingAvailability === RadioOptions.YES) {
      this.firstHearingFormGroup.setValidators([this.validatorsUtils.hearingDateValidator()]);
    } else if (this.checkedHearingAvailability === RadioOptions.CHOOSE_DATE_RANGE) {
      this.dateRangeHearingFormGroup.setValidators([this.validatorsUtils.hearingDateRangeValidator()]);
    }
    this.firstHearingFormGroup.updateValueAndValidity();
    this.dateRangeHearingFormGroup.updateValueAndValidity();
  }

  public checkUnavailableDatesList(dateList: UnavailabilityRangeModel[]): void {
    dateList.forEach(dateRange => {
      this.setUnavailableDates(dateRange);
    });
    this.partiesNotAvailableDates.sort((currentDate, previousDate) => new Date(currentDate).getTime() - new Date(previousDate).getTime());
  }

  public setUnavailableDates(dateRange: UnavailabilityRangeModel): void {
    const startDate = moment(dateRange.unavailableFromDate);
    const endDate = moment(dateRange.unavailableToDate);

    while (startDate <= endDate) {
      const currentDate = startDate.format(HearingDateEnum.DisplayMonth);
      if (this.isWeekDay(startDate) && !this.partiesNotAvailableDates.includes(currentDate)) {
        this.partiesNotAvailableDates.push(currentDate);
      }
      startDate.add(1, 'd');
    }
  }

  public isWeekDay(givenDate: moment.Moment): boolean {
    return (givenDate.weekday() !== 6) && (givenDate.weekday() !== 0);
  }

  public showHearingLengthError(): void {
    const durationLengthFormGroup = this.priorityForm.controls.durationLength;
    if (!durationLengthFormGroup.get('hours').valid) {
      this.hearingLengthErrorValue = HearingDatePriorityEnum.LengthError;
      this.validationErrors.push({ id: 'durationhours', message: HearingDatePriorityEnum.LengthError });
    } else if (!durationLengthFormGroup.get('minutes').valid) {
      this.hearingLengthErrorValue = HearingDatePriorityEnum.LengthMinutesError;
      this.validationErrors.push({ id: 'durationmins', message: HearingDatePriorityEnum.LengthMinutesError });
    } else if (!durationLengthFormGroup.valid) {
      this.hearingLengthErrorValue = HearingDatePriorityEnum.TotalLengthError;
      this.validationErrors.push({ id: 'durationhours', message: HearingDatePriorityEnum.TotalLengthError });
    }
  }

  public showChosenDateError(): void {
    const isInValidDate = this.getDateFormatted(this.firstHearingFormGroup, this.firstHearingDate.id).includes(null);
    const choosenDate = moment(this.getDateFormatted(this.firstHearingFormGroup, this.firstHearingDate.id), HearingDateEnum.DefaultFormat);
    const isPastDate = choosenDate.isBefore() || choosenDate.isSame(new Date(), 'd');
    const isFirstHearingDateValid = moment(choosenDate, HearingDateEnum.DefaultFormat, true).isValid();
    const isWeekday = this.isWeekDay(choosenDate);
    if (isInValidDate) {
      this.validationErrors.push({
        id: this.firstHearingDate.id,
        message: HearingDatePriorityEnum.InValidHearingDateError
      });
      this.firstDateOfHearingError = {isInvalid: true, messages: [HearingDatePriorityEnum.InValidHearingDateError]};
    } else if (!isFirstHearingDateValid) {
      this.validationErrors.push({id: this.firstHearingDate.id, message: HearingDatePriorityEnum.DateRangeError});
      this.firstDateOfHearingError = {isInvalid: true, messages: [HearingDatePriorityEnum.DateRangeError]};
    } else if (!isWeekday) {
      this.validationErrors.push({id: this.firstHearingDate.id, message: HearingDatePriorityEnum.WeekendError});
      this.firstDateOfHearingError = {isInvalid: true, messages: [HearingDatePriorityEnum.WeekendError]};
    } else if (isPastDate) {
      this.validationErrors.push({id: this.firstHearingDate.id, message: HearingDatePriorityEnum.DatePastError});
      this.firstDateOfHearingError = {isInvalid: true, messages: [HearingDatePriorityEnum.DatePastError]};
    }
  }

  public showChosenDateRangeError(): void {
    const isInValidEarliestDate = this.getDateFormatted(this.earliestHearingFormGroup, this.earliestHearingDate.id).includes(null);
    const isInValidLatestDate = this.getDateFormatted(this.latestHearingFormGroup, this.latestHearingDate.id).includes(null);
    const choosenEarliestDate = moment(this.getDateFormatted(this.earliestHearingFormGroup, this.earliestHearingDate.id), HearingDateEnum.DefaultFormat);
    const choosenLatestDate = moment(this.getDateFormatted(this.latestHearingFormGroup, this.latestHearingDate.id), HearingDateEnum.DefaultFormat);
    const isPastEarliestDate = choosenEarliestDate.isBefore() || choosenEarliestDate.isSame(new Date(), 'd');
    const isPastLatestDate = choosenLatestDate.isBefore() || choosenLatestDate.isSame(new Date(), 'd');
    const isLatestBeforeEarliest = choosenEarliestDate > choosenLatestDate;
    const isEarliestDateValid = choosenEarliestDate.isValid();
    const isLatestHearingDate = choosenLatestDate.isValid();
    if (!isInValidEarliestDate && isPastEarliestDate) {
      this.validationErrors.push({id: this.earliestHearingDate.id, message: HearingDatePriorityEnum.DatePastError});
      this.earliestDateOfHearingError = {isInvalid: true, messages: [HearingDatePriorityEnum.DatePastError]};
    } else if (!isInValidLatestDate && isPastLatestDate) {
      this.validationErrors.push({id: this.latestHearingDate.id, message: HearingDatePriorityEnum.DatePastError});
      this.latestDateOfHearingError = {isInvalid: true, messages: [HearingDatePriorityEnum.DatePastError]};
    } else if (isInValidEarliestDate || isInValidLatestDate || !isEarliestDateValid || !isLatestHearingDate) {
      if ((this.earliestHearingFormGroup.dirty || (this.earliestHearingFormGroup.pristine && this.latestHearingFormGroup.pristine)) && (isInValidEarliestDate || !isEarliestDateValid)) {
        this.validationErrors.push({id: this.earliestHearingDate.id, message: HearingDatePriorityEnum.DateRangeError});
        this.earliestDateOfHearingError = {isInvalid: true, messages: [HearingDatePriorityEnum.DateRangeError]};
      }
      if ((this.latestHearingFormGroup.dirty || (this.earliestHearingFormGroup.pristine && this.latestHearingFormGroup.pristine)) && (isInValidLatestDate || !isLatestHearingDate)) {
        this.validationErrors.push({id: this.latestHearingDate.id, message: HearingDatePriorityEnum.DateRangeError});
        this.latestDateOfHearingError = {isInvalid: true, messages: [HearingDatePriorityEnum.DateRangeError]};
      }
    } else if (isEarliestDateValid && isLatestHearingDate && isLatestBeforeEarliest) {
      this.validationErrors.push({
        id: this.earliestHearingDate.id,
        message: HearingDatePriorityEnum.EarliestHearingDateError
      });
      this.earliestDateOfHearingError = {isInvalid: true, messages: [HearingDatePriorityEnum.EarliestHearingDateError]};
    }
  }

  public showHearingDateError(): void {
    if (!this.priorityForm.controls.specificDate.valid) {
      this.hearingPriorityDateError = HearingDatePriorityEnum.PriorityDateError;
      this.validationErrors.push({id: 'noSpecificDate', message: HearingDatePriorityEnum.PriorityDateError});
    } else if (this.priorityForm.controls.specificDate.value === RadioOptions.YES) {
      this.showChosenDateError();
    } else if (this.priorityForm.controls.specificDate.value === RadioOptions.CHOOSE_DATE_RANGE) {
      this.showChosenDateRangeError();
    }
  }

  public showHearingPriorityError(): void {
    if (!this.priorityForm.controls.priority.valid) {
      this.hearingPriorityError = HearingDatePriorityEnum.PriorityError;
      this.validationErrors.push({id: this.priorities[0].key, message: HearingDatePriorityEnum.PriorityError});
    }
  }

  public checkFormData(): void {
    this.validationErrors = [];
    this.hearingLengthErrorValue = null;
    this.latestDateOfHearingError = null;
    this.earliestDateOfHearingError = null;
    this.firstDateOfHearingError = null;
    this.hearingPriorityError = null;
    this.hearingPriorityDateError = null;
    if (!this.priorityForm.valid) {
      this.showHearingLengthError();
      this.showHearingDateError();
      this.showHearingPriorityError();
    }
  }

  public getDateFormatted(formGroup: FormGroup, fieldName: string): string {
    const day = formGroup.get(`${fieldName}_day`).value;
    const month = formGroup.get(`${fieldName}_month`).value;
    const year = formGroup.get(`${fieldName}_year`).value;
    if (day === '' || month === '' || year === '') {
      return null;
    }
    return `${day}-${month}-${year}`;
  }

  public executeAction(action: ACTION): void {
    if (action === ACTION.CONTINUE) {
      this.checkFormData();
      if (this.isFormValid()) {
        this.prepareHearingRequestData();
        super.navigateAction(action);
      }
    } else if (action === ACTION.BACK) {
      super.navigateAction(action);
    }
  }

  public prepareHearingRequestData(): void {
    const duration = Number(this.priorityForm.value.durationLength.hours * 60) + Number(this.priorityForm.value.durationLength.minutes);
    let firstDate = '';
    let secondDate = '';
    if (this.priorityForm.value.specificDate === RadioOptions.YES) {
      firstDate = `${moment(Object.values(this.priorityForm.value.firstHearing).join('-'), HearingDateEnum.DefaultFormat).toDate()}`;
    } else if (this.priorityForm.value.specificDate === RadioOptions.CHOOSE_DATE_RANGE) {
      firstDate = `${moment(Object.values(this.priorityForm.value.dateRangeHearing.earliestHearing).join('-'), HearingDateEnum.DefaultFormat).toDate()}`;
      secondDate = `${moment(Object.values(this.priorityForm.value.dateRangeHearing.latestHearing).join('-'), HearingDateEnum.DefaultFormat).toDate()}`;
    }
    this.hearingRequestMainModel = {
      ...this.hearingRequestMainModel,
      hearingDetails: {
        ...this.hearingRequestMainModel.hearingDetails,
        duration,
        hearingWindow: {
          hearingWindowDateRange: {
            hearingWindowStartDateRange: firstDate,
            hearingWindowEndDateRange: secondDate
          },
          hearingWindowFirstDate: firstDate
        },
        hearingPriorityType: this.priorityForm.value.priority
      }
    };
  }

  public isFormValid(): boolean {
    return this.validationErrors.length === 0;
  }

  public ngAfterViewInit(): void {
    this.fragmentFocus();
  }

  public ngOnDestroy(): void {
    super.unsubscribe();
  }
}