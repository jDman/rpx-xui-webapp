import { Injectable } from '@angular/core';
import { AbstractControl, ValidatorFn } from '@angular/forms';
import * as moment from 'moment';
import { HearingDateEnum } from '../models/hearings.enum';

@Injectable({ providedIn: 'root' })
export class ValidatorsUtils {
  public numberLargerThanValidator(greaterThan: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const inputNumber = Number(control.value);
      return control.value ? !isNaN(Number(control.value)) && inputNumber >= greaterThan ? null : { isValid: false } : { isValid: false };
    };
  }

  public numberMinMaxValidator(minNumber: number, maxNumber: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const inputNumber = Number(control.value) || 0;
      return !isNaN(Number(control.value)) && inputNumber >= minNumber && inputNumber <= maxNumber ? null : { isValid: false };
    };
  }

  public numberMultipleValidator(givenNumber: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const inputNumber = Number(control.value) || 0;
      return !isNaN(Number(control.value)) && (inputNumber % givenNumber) === 0 ? null : { isValid: false };
    };
  }

  public minutesValidator(minNumber: number, maxNumber: number, totalNumber: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const hours = Number(control.get('hours').value) || 0;
      const minutes = Number(control.get('minutes').value) || 0;
      const totalMinutes = (hours * 60) + minutes;
      return totalMinutes >= minNumber && minutes <= maxNumber && totalMinutes <= totalNumber ? null : { isValid: false };
    };
  }

  public hearingDateValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const isValidDate = Object.values(control.value).every(value => value !== null);
      const selectedDate = moment(Object.values(control.value).join('-'), HearingDateEnum.DefaultFormat);
      return isValidDate && selectedDate.isValid() &&
        (!selectedDate.isBefore() || selectedDate.isSame(new Date(), 'd')) &&
        ((selectedDate.weekday() !== 6) && (selectedDate.weekday() !== 0))
        ? null : { isValid: false };
    };
  }

  public calcBusinessDays(startDate: moment.Moment, endDate: moment.Moment): number {
    const day = startDate;
    let businessDays = 0;

    while (day.isSameOrBefore(endDate, 'day')) {
      if (day.day() !== 0 && day.day() !== 6) {
        businessDays++;
      }
      day.add(1, 'd');
    }
    return businessDays;
  }

  public hearingDateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const firstDateRangeList = Object.values(control.value[Object.keys(control.value)[0]]);
      const secondDateRangeList = Object.values(control.value[Object.keys(control.value)[1]]);
      const isValidFirstDate = firstDateRangeList.every(value => value !== null);
      const isValidSecondDate = secondDateRangeList.every(value => value !== null);
      const firstDateNullLength = firstDateRangeList.filter((value) => value === null).length;
      const secondDateNullLength = secondDateRangeList.filter((value) => value === null).length;
      const firstDate = moment(firstDateRangeList.join('-'), HearingDateEnum.DefaultFormat);
      const secondDate = moment(secondDateRangeList.join('-'), HearingDateEnum.DefaultFormat);
      const isLatestDate = (isValidFirstDate && isValidSecondDate) ? secondDate >= firstDate : (isValidFirstDate || isValidSecondDate);
      const numberOfBusinessDays = this.calcBusinessDays(firstDate, secondDate);
      return (isValidFirstDate || isValidSecondDate) && (firstDateNullLength === 0 || firstDateNullLength === 3) && (secondDateNullLength === 0 || secondDateNullLength === 3) &&
        (firstDate.isValid() || secondDate.isValid()) && isLatestDate &&
        (isValidFirstDate ? (firstDate.isAfter() || firstDate.isSame(new Date(), 'd')) : true) &&
        (isValidSecondDate ? (secondDate.isAfter() || secondDate.isSame(new Date(), 'd')) : true) &&
        numberOfBusinessDays !== 0
        ? null : { isValid: false };
    };
  }

  public errorValidator(message: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      return { error: message };
    };
  }

  public formArraySelectedValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      return control.value.every((option) => !option.selected) ? { isValid: false } : null;
    };
  }
}
