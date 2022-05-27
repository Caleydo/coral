import { Cohort } from '../../Cohort';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute } from '../../data/Attribute';
import { ATask } from './ATask';
export declare class Characterize extends ATask {
    label: string;
    id: string;
    hasOutput: boolean;
    private eventID;
    private _entityName;
    private ids;
    private reader;
    supports(attributes: IAttribute[], cohorts: ICohort[]): boolean;
    showSearchBar(): boolean;
    show(columnHeader: HTMLDivElement, container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): Promise<void>;
    appendTable(): void;
    sendData(endpoint: any, ids: any): Promise<void>;
    visualize(response: any): Promise<void>;
    getData(attributes: IAttribute[], cohorts: Cohort[]): Promise<unknown[]>;
    postData(url?: string, data?: {}): Promise<Response>;
}
