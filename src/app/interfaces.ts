import { IElementProvJSON, IElementProvJSONCohort } from '../CohortInterfaces';
import { IEntitySourceConfig } from '../utilIdTypes';

export interface IPanelDesc {
  id: string;
  description: string;
  species: string;
}

export interface IDatasetDesc {
  source: IEntitySourceConfig;
  panel?: IPanelDesc;
  rootCohort: IElementProvJSONCohort;
  chtOverviewElements: IElementProvJSON[];
}
