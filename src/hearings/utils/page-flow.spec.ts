import {Observable, of} from 'rxjs';
import {ScreenNavigationModel} from '../models/screenNavigation.model';
import {PageFlow} from './page-flow';

describe('PageFlow', () => {
  let pageFlow: PageFlow;
  const mockRoute = jasmine.createSpyObj('Route', ['navigate']);
  const mockStore = jasmine.createSpyObj('Store', ['pipe', 'dispatch']);

  const SCREEN_FLOW: ScreenNavigationModel[] = [
    {
      screenName: 'hearing-requirements',
      navigation: [
        {
          resultValue: 'hearing-facilities',
        },
      ],
    },
    {
      screenName: 'hearing-facilities',
      navigation: [
        {
          resultValue: 'hearing-stage',
        },
      ],
    },
    {
      screenName: 'hearing-stage',
      navigation: [
        {
          resultValue: 'hearing-attendance',
        },
      ],
    },
    {
      screenName: 'hearing-attendance',
      navigation: [
        {
          resultValue: 'hearing-venue',
        },
      ],
    },
    {
      screenName: 'hearing-venue',
      conditionKey: 'region',
      navigation: [
        {
          conditionOperator: 'INCLUDE',
          conditionValue: 'Wales',
          resultValue: 'hearing-welsh',
        },
        {
          conditionOperator: 'NOT INCLUDE',
          conditionValue: 'Wales',
          resultValue: 'hearing-judge',
        },
      ],
    },
    {
      screenName: 'hearing-welsh',
      navigation: [
        {
          resultValue: 'hearing-judge',
        },
      ],
    },
    {
      screenName: 'hearing-judge',
      navigation: [
        {
          resultValue: 'hearing-panel',
        },
      ],
    },
    {
      screenName: 'hearing-panel',
      navigation: [
        {
          resultValue: 'hearing-timing',
        },
      ],
    },
    {
      screenName: 'hearing-timing',
      navigation: [
        {
          resultValue: 'hearing-additional-instructions',
        },
      ],
    },
    {
      screenName: 'hearing-additional-instructions',
      navigation: [
        {
          resultValue: 'hearing-check-answers',
        },
      ],
    },
  ];

  beforeEach(() => {
    pageFlow = new PageFlow(mockStore, mockRoute);
  });

  it('should get current page', () => {
    mockRoute.url = '/request/hearing/hearing-requirements';
    expect(pageFlow.getCurrentPage()).toBe('hearing-requirements');
  });

  it('should get last page', () => {
    const screensNavigations$: Observable<ScreenNavigationModel[]> = of(SCREEN_FLOW);
    pageFlow.hearingConditions$ = of({});
    mockRoute.url = '/request/hearing/hearing-facilities';
    const lastPage = pageFlow.getLastPage(screensNavigations$);
    expect(lastPage).toBe('hearing-requirements');
  });

  it('should get last page hearing-welsh if region is including Wales', () => {
    const screensNavigations$: Observable<ScreenNavigationModel[]> = of(SCREEN_FLOW);
    pageFlow.hearingConditions$ = of({region: 'Wales, South East'});
    mockRoute.url = '/request/hearing/hearing-judge';
    const lastPage = pageFlow.getLastPage(screensNavigations$);
    expect(lastPage).toBe('hearing-welsh');
  });


  it('should get last page hearing-venue if region is not including Wales', () => {
    const screensNavigations$: Observable<ScreenNavigationModel[]> = of(SCREEN_FLOW);
    pageFlow.hearingConditions$ = of({region: 'South East'});
    mockRoute.url = '/request/hearing/hearing-judge';
    const lastPage = pageFlow.getLastPage(screensNavigations$);
    expect(lastPage).toBe('hearing-venue');
  });

  it('should get next page', () => {
    const screensNavigations$: Observable<ScreenNavigationModel[]> = of(SCREEN_FLOW);
    pageFlow.hearingConditions$ = of({});
    mockRoute.url = '/request/hearing/hearing-requirements';
    const nextPage = pageFlow.getNextPage(screensNavigations$);
    expect(nextPage).toBe('hearing-facilities');
  });

  it('should get next page hearing-welsh if region is including Wales', () => {
    const screensNavigations$: Observable<ScreenNavigationModel[]> = of(SCREEN_FLOW);
    pageFlow.hearingConditions$ = of({region: 'Wales, South East'});
    mockRoute.url = '/request/hearing/hearing-venue';
    const nextPage = pageFlow.getNextPage(screensNavigations$);
    expect(nextPage).toBe('hearing-welsh');
  });

  it('should get next page hearing-judge if region is not including Wales', () => {
    const screensNavigations$: Observable<ScreenNavigationModel[]> = of(SCREEN_FLOW);
    pageFlow.hearingConditions$ = of({region: 'South East'});
    mockRoute.url = '/request/hearing/hearing-venue';
    const nextPage = pageFlow.getNextPage(screensNavigations$);
    expect(nextPage).toBe('hearing-judge');
  });

  afterEach(() => {
    pageFlow = null;
  });
})
;