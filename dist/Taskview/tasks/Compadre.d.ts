import { Cohort } from '../../Cohort';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute } from '../../data/Attribute';
import { ATask } from './ATask';
export declare class Compadre extends ATask {
    label: string;
    id: string;
    hasOutput: boolean;
    private eventID;
    private _entityName;
    private ids;
    supports(attributes: IAttribute[], cohorts: ICohort[]): boolean;
    showSearchBar(): boolean;
    show(columnHeader: HTMLDivElement, container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): Promise<void>;
    appendTable(): void;
    sendData(ids: any): Promise<void>;
    visualize(response: any): void;
    getData(attributes: IAttribute[], cohorts: Cohort[]): Promise<unknown[]>;
    postData(url?: string, data?: {}): Promise<any>;
}
