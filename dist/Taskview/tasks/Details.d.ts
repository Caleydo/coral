import { ICohort } from '../../CohortInterfaces';
import { IAttribute } from '../../data/Attribute';
import { ATask } from './ATask';
export declare class Details extends ATask {
    label: string;
    id: string;
    hasOutput: boolean;
    private _builder;
    private _idType;
    private _entityName;
    private $lineUpContainer;
    private _idColRoot;
    private _rootChtId;
    private _currData;
    private _oldAttrsId;
    private _oldChtsdbId;
    supports(attributes: IAttribute[], cohorts: ICohort[]): boolean;
    showSearchBar(): boolean;
    show(container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): void;
    addAttribute(attributes: IAttribute[], cohorts: ICohort[]): Promise<void>;
    getCategoryColorsForColumn(mergedDataArray: any[], attr: IAttribute): {
        name: string;
        color: string;
    }[];
    mergeCohortData(source: any[], target: any[], propConflicts: string[]): any[];
}
