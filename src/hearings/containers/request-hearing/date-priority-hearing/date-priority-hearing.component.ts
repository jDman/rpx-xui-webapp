import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RefDataModel } from 'api/hearings/models/refData.model';

@Component({
  selector: 'exui-date-priority-hearing',
  templateUrl: './date-priority-hearing.component.html',
  styleUrls: ['./date-priority-hearing.component.scss']
})
export class DatePriorityHearingComponent implements OnInit {
  public priorityForm: FormGroup;
  public priorities: RefDataModel[];
  public checkedHearingAvailability: string;
  public partiesNotAvailableDates: string[];

  constructor(private readonly formBuilder: FormBuilder,
              private readonly route: ActivatedRoute) { }

  public ngOnInit(): void {
    this.initForm();

    this.priorities = this.route.snapshot.data.hearingPriorities.priorities.sort((a, b) => (a.order < b.order ? -1 : 1));

    // TODO: Get dates from a service
    this.partiesNotAvailableDates = ['2 November 2021', '3 November 2021', '4 November 2021'];
  }

  /**
   * Inits form
   */
  public initForm(): void {
    this.priorityForm = this.formBuilder.group({
      durationLength: this.formBuilder.group({
        hours: [],
        minutes: []
      }),
      hearingAvailability: [],
    });
  }

  public showDateAvailability(): void {
    this.checkedHearingAvailability = this.priorityForm.get('hearingAvailability').value;
  }

}