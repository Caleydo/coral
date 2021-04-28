import {ICohort} from '../../CohortInterfaces';
import {IAttribute} from '../../data/Attribute';

export interface IVisualization {
  destroy();
  hasSelectedData(): boolean;
  getSelectedData(): {from: string | number, to: string | number, cohort: ICohort}[];
  show(container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): void;
  filter(): void;
  split(): void;
  clearSelection(): void;
}
