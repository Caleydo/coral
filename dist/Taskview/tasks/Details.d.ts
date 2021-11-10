import { Cohort } from '../../Cohort';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute } from '../../data/Attribute';
import { ATask } from './ATask';
export declare class Details extends ATask {
    label: string;
    id: string;
    hasOutput: boolean;
    private eventID;
    private _entityName;
    private $lineUpContainer;
    supports(attributes: IAttribute[], cohorts: ICohort[]): boolean;
    showSearchBar(): boolean;
    show(columnHeader: HTMLDivElement, container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): Promise<void>;
    getData(attributes: IAttribute[], cohorts: Cohort[]): Promise<any[]>;
    createLineup(data: any, attributes: any, cohorts: any): Promise<void>;
    getCategoryColorsForColumn(mergedDataArray: any[], attr: IAttribute): {
        name: string;
        color: string;
    }[];
}
