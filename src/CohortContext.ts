import type { ICohort } from './app/interfaces';
import type { CohortOverview } from './Overview/CohortOverview';
import type Taskview from './Taskview/Taskview';

export interface ICohortContext {
  cohortOverview: CohortOverview;
  taskview: Taskview;
  referenceCohort: ICohort;
}

export const CohortContext: ICohortContext = {
  cohortOverview: null,
  taskview: null,
  referenceCohort: null,
};
