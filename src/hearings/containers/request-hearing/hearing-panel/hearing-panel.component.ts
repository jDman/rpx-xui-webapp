import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { JudicialUserModel } from '../../../../hearings/models/judicialUser.model';
import { PanelPreferenceModel } from '../../../../hearings/models/panelPreference.model';
import { HearingJudgeNamesListComponent } from '../../../components';
import { ACTION, ControlTypeEnum, HearingPanelSelectionEnum, MemberType, RadioOptions, RequirementType } from '../../../models/hearings.enum';
import { LovRefDataModel } from '../../../models/lovRefData.model';
import { HearingsService } from '../../../services/hearings.service';
import * as fromHearingStore from '../../../store';
import { RequestHearingPageFlow } from '../request-hearing.page.flow';

@Component({
  selector: 'exui-hearing-panel',
  templateUrl: './hearing-panel.component.html',
})
export class HearingPanelComponent extends RequestHearingPageFlow implements OnInit, AfterViewInit, OnDestroy {
  public panelJudgeForm: FormGroup;
  public validationErrors: { id: string, message: string }[] = [];
  public includedJudgeList: JudicialUserModel[] = [];
  public excludedJudgeList: JudicialUserModel[] = [];
  public selectedPanelRoles: JudicialUserModel[] = [];
  public panelSelection: string;
  public multiLevelSelections: LovRefDataModel[] = [];
  public panelSelectionError: string;
  public hasValidationRequested: boolean = false;
  public childNodesValidationError: string;
  public personalCodejudgeList: JudicialUserModel[] = [];
  public configLevels: { level: number, controlType: ControlTypeEnum }[];
  @ViewChild('includedJudge') public includedJudge: HearingJudgeNamesListComponent;
  @ViewChild('excludedJudge') public excludedJudge: HearingJudgeNamesListComponent;

  constructor(
    protected readonly hearingStore: Store<fromHearingStore.State>,
    protected readonly hearingsService: HearingsService,
    protected readonly route: ActivatedRoute,
    private readonly formBuilder: FormBuilder) {
    super(hearingStore, hearingsService);
    this.multiLevelSelections = this.route.snapshot.data.otherPanelRoles;
    this.personalCodejudgeList = this.route.snapshot.data.judicialUsers;
    this.configLevels = [
      {
        controlType: ControlTypeEnum.CHECK_BOX,
        level: 1,
      },
      {
        controlType: ControlTypeEnum.SELECT,
        level: 2,
      }
    ];
  }

  public ngOnInit(): void {
    this.initForm();
  }

  public childNodesValidation(): boolean {
    let childNodeValid: boolean = true;
    const panelRoles = this.convertArrayToRefDataModel(this.panelJudgeForm.controls.multiLevelSelect as FormArray);
    panelRoles.filter(panelRole => panelRole.selected && panelRole.child_nodes && panelRole.child_nodes.length)
      .forEach(selectedPanelRole => {
        if (selectedPanelRole.child_nodes.filter(node => node.selected).length === 0) {
          childNodeValid = false;
        }
      });
    return childNodeValid;
  }

  public initForm(): void {
    this.panelJudgeForm = this.formBuilder.group({
      specificPanel: ['', Validators.required],
      multiLevelSelect: this.formBuilder.array([])
    });
    this.excludedJudgeList = this.getPannelMemberList(RequirementType.EXCLUDE);
    this.includedJudgeList = this.getPannelMemberList(RequirementType.MUSTINC);
    this.loadHearingPanels();
    this.panelJudgeForm.controls.multiLevelSelect = this.convertRefDataModelToArray(this.multiLevelSelections);
  }

  public getPannelMemberList(panelRequirementType: string): JudicialUserModel[] {
    const selectedPanelList: JudicialUserModel[] = [];
    const panelRequirements = this.hearingRequestMainModel.hearingDetails.panelRequirements;
    const panelMemberIDs = panelRequirements && panelRequirements.panelPreferences && panelRequirements.panelPreferences.filter(preferences => preferences.memberType === MemberType.PANEL_MEMBER && preferences.requirementType === panelRequirementType).map(preferences => preferences.memberID);
    if (panelMemberIDs && panelMemberIDs.length) {
      this.personalCodejudgeList.forEach(judgeInfo => {
        if (panelMemberIDs.includes(judgeInfo.personal_code)) {
          const judgeDetail: JudicialUserModel = {
            email_id: judgeInfo.email_id,
            sidam_id: judgeInfo.sidam_id,
            known_as: judgeInfo.known_as,
            surname: judgeInfo.surname,
            personal_code: judgeInfo.personal_code,
            full_name: judgeInfo.full_name,
            object_id: judgeInfo.object_id,
            post_nominals: judgeInfo.post_nominals
          };
          selectedPanelList.push(judgeDetail);
        }
      });
    }
    return selectedPanelList;
  }

  public loadPanel(multi: LovRefDataModel, panelSpecialism: string): boolean {
    let skip = false;
    if (multi.child_nodes && multi.child_nodes.length) {
      multi.child_nodes.forEach(node => {
        if (node.key.toLowerCase().trim() === panelSpecialism.toLocaleLowerCase().trim() && !skip && !multi.selected) {
          node.selected = multi.selected = true;
          node.child_nodes && node.child_nodes.length ? skip = this.loadPanel(node, panelSpecialism) : skip = true;
        }
      });
    } else {
      if (multi.key === panelSpecialism) {
        multi.selected = true;
        skip = true;
      }
    }
    return skip;
  }

  public loadHearingPanels(): void {
    this.panelSelection = '';
    if (
      this.hearingRequestMainModel.hearingDetails &&
      this.hearingRequestMainModel.hearingDetails.panelRequirements &&
      this.hearingRequestMainModel.hearingDetails.panelRequirements.panelSpecialisms) {
      // tslint:disable-next-line: prefer-for-of
      let skip: boolean = false;
      this.hearingRequestMainModel.hearingDetails.panelRequirements.panelSpecialisms.forEach(panelSpecialism => {
        skip = false;
        this.multiLevelSelections.forEach(multiLevelSelectionFiltered => {
          if (!skip) {
            skip = this.loadPanel(multiLevelSelectionFiltered, panelSpecialism);
          }
        });
      });
    }
    const hearingPanelRequirements = this.hearingRequestMainModel.hearingDetails.panelRequirements;
    const panelSpecialismsLength = hearingPanelRequirements && hearingPanelRequirements.panelSpecialisms && hearingPanelRequirements.panelSpecialisms.length || 0;
    if (panelSpecialismsLength || this.excludedJudgeList.length || this.includedJudgeList.length) {
      this.showSpecificPanel(RadioOptions.YES);
    } else {
      this.showSpecificPanel(RadioOptions.NO);

    }
  }

  public preparePanelChildren(panelRoles: LovRefDataModel[], accummulation: string[]) {
    if (panelRoles) {
      panelRoles.forEach(panelRole => {
        panelRole.selected && (!panelRole.child_nodes || !panelRole.child_nodes.length) ? accummulation.push(panelRole.key) :
          this.preparePanelChildren(panelRole.child_nodes, accummulation);
      });
    }
  }

  public prepareData(): void {
    const panelRoles: LovRefDataModel[] = this.convertArrayToRefDataModel(this.panelJudgeForm.controls.multiLevelSelect as FormArray);
    const panelRolesSelected: string[] = [];
    const selectedPanelMembers: PanelPreferenceModel[] = [] as PanelPreferenceModel[];
    const hearingPanelRequiredFlag = this.panelJudgeForm.controls.specificPanel.value === RadioOptions.YES
    if (hearingPanelRequiredFlag) {
      this.includedJudge.judgeList.forEach(judgeInfo => {
        const panelPreference: PanelPreferenceModel = {
          memberID: judgeInfo.personal_code,
          memberType: MemberType.PANEL_MEMBER,
          requirementType: RequirementType.MUSTINC
        };
        selectedPanelMembers.push(panelPreference);
      });
      this.excludedJudge.judgeList.forEach(judgeInfo => {
        const panelPreference: PanelPreferenceModel = {
          memberID: judgeInfo.personal_code,
          memberType: MemberType.PANEL_MEMBER,
          requirementType: RequirementType.EXCLUDE
        };
        selectedPanelMembers.push(panelPreference);
      });
      this.preparePanelChildren(panelRoles, panelRolesSelected);
    }
    const panelRequirements = this.hearingRequestMainModel.hearingDetails.panelRequirements;
    const selectedPanelJudges: PanelPreferenceModel[] = panelRequirements && panelRequirements.panelPreferences && panelRequirements.panelPreferences.filter(preferences => preferences.memberType === MemberType.JUDGE) || [];
    this.hearingRequestMainModel = {
      ...this.hearingRequestMainModel,
      hearingDetails: {
        ...this.hearingRequestMainModel.hearingDetails,
        panelRequirements: {
          ...this.hearingRequestMainModel.hearingDetails.panelRequirements,
          panelPreferences: [...selectedPanelMembers, ...selectedPanelJudges],
          panelSpecialisms: [...panelRolesSelected]
        }
      }
    };
  }

  public convertArrayToRefDataModel(array: FormArray): LovRefDataModel[] {
    const panelRoles: LovRefDataModel[] = [];
    array.controls.forEach(control => {
      const refDataModel: LovRefDataModel = {
        key: control.value.key,
        value_en: control.value.value_en,
        value_cy: control.value.value_cy,
        hintText_EN: control.value.hintText_EN,
        hintTextCY: control.value.hintTextCY,
        order: control.value.order,
        parentKey: control.value.parentKey,
        child_nodes: control.value && control.value.child_nodes ? control.value.child_nodes : [],
        selected: control.value.selected,
      };
      panelRoles.push(refDataModel);
    });
    return panelRoles;
  }

  public convertRefDataModelToArray(dataSource: LovRefDataModel[]): FormArray {
    const dataSourceArray = this.formBuilder.array([]);
    dataSource.forEach(otherPanelRoles => {
      dataSourceArray.push(this.patchValues({
        key: otherPanelRoles.key,
        value_en: otherPanelRoles.value_en,
        value_cy: otherPanelRoles.value_cy,
        hintText_EN: otherPanelRoles.hintText_EN,
        hintTextCY: otherPanelRoles.hintTextCY,
        order: otherPanelRoles.order,
        parentKey: otherPanelRoles.parentKey,
        child_nodes: otherPanelRoles.child_nodes,
        selected: !otherPanelRoles.selected ? false : true,
      } as LovRefDataModel) as FormGroup);
    });
    return dataSourceArray;
  }

  public patchValues(refDataModel: LovRefDataModel): FormGroup {
    return this.formBuilder.group({
      key: [refDataModel.key],
      value_en: [refDataModel.value_en],
      value_cy: [refDataModel.value_cy],
      hintText_EN: [refDataModel.hintText_EN],
      hintTextCY: [refDataModel.hintText_EN],
      order: [refDataModel.order],
      parentKey: [refDataModel.parentKey],
      selected: [refDataModel.selected, Validators.required],
      child_nodes: refDataModel.child_nodes && refDataModel.child_nodes.length > 0 ? this.convertRefDataModelToArray(refDataModel.child_nodes) : []
    });
  }

  public showSpecificPanel(judgeSelection: string): void {
    this.panelSelection = judgeSelection;
    this.panelJudgeForm.controls.specificPanel.setValue(this.panelSelection);
  }

  public executeAction(action: ACTION): void {
    if (action === ACTION.CONTINUE) {
      if (this.isFormValid()) {
        this.prepareData();
        super.navigateAction(action);
      }
    } else if (action === ACTION.BACK) {
      super.navigateAction(action);
    }
  }

  public isFormValid(): boolean {
    this.validationErrors = [];
    this.childNodesValidationError = null;
    this.panelSelectionError = null;
    const panelRequiredFlag = this.panelJudgeForm.controls.specificPanel.value === RadioOptions.YES
    if (panelRequiredFlag) {
      const selectedPanelRoles: LovRefDataModel[] = this.convertArrayToRefDataModel(this.panelJudgeForm.controls.multiLevelSelect as FormArray).filter(role => role.selected)
      const panelRolesValid = this.childNodesValidation()
      const validIncludeOrExcludeSelection = this.includedJudge.judgeList.length > 0 || this.excludedJudge.judgeList.length > 0
      if (panelRolesValid) {
        if (!selectedPanelRoles.length) {
          if (!validIncludeOrExcludeSelection) {
            this.panelSelectionError = HearingPanelSelectionEnum.SelectionError;
            this.validationErrors.push({ id: 'specific-panel-selection', message: HearingPanelSelectionEnum.SelectionError });
            return false;
          }
        }
      } else {
        this.hasValidationRequested = true
        this.childNodesValidationError = HearingPanelSelectionEnum.PanelRowChildError;
        this.validationErrors.push({ id: 'panel-role-selector', message: HearingPanelSelectionEnum.PanelRowChildError });
        return false;
      }
    }
    return this.panelJudgeForm.valid;
  }

  public ngAfterViewInit(): void {
    this.fragmentFocus();
  }

  public ngOnDestroy(): void {
    super.unsubscribe();
  }
}