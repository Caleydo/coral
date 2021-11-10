import { IAllFilters } from 'tdp_core';
import { Cohort } from '../Cohort';
import { HistRouteType, ICohortDBHistDataParms, ICohortDBHistPanelParms, ICohortDBHistScoreDepletionParms, ICohortDBHistScoreParms, IEqualsList, INumRange } from '../rest';
import { AttributeType, IdValuePair } from './Attribute';
export interface ISpecialAttribute {
    readonly overrideSearchBarDetails: boolean;
    readonly overrideGetData: boolean;
    readonly overrideGetHist: boolean;
    readonly overrideGetCount: boolean;
    readonly overrideFilter: boolean;
    /**
     * id database access the data
     */
    readonly id: string;
    label: string;
    type: AttributeType;
    dataKey: string;
    /**
     * Possible options the attribute could be formated
     */
    options: {
        id: string;
        name: string;
    }[];
    /**
     * Option that is should be used to format the data
     */
    attributeOption: string;
    getDetailForSearchBar(): HTMLDivElement;
    getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]>;
    getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{
        bin: string;
        count: number;
    }[]>;
    getHistWithStorage(histType: HistRouteType, params: ICohortDBHistDataParms | ICohortDBHistScoreParms | ICohortDBHistScoreDepletionParms | ICohortDBHistPanelParms): Promise<{
        bin: string;
        count: number;
    }[]>;
    getCount(cohortDbId: number, filters?: IAllFilters): Promise<number>;
    filter(cht: Cohort, filter: INumRange[] | IEqualsList, label: string): Promise<Cohort>;
}
export declare class SATreatment implements ISpecialAttribute {
    readonly overrideSearchBarDetails: boolean;
    readonly overrideGetData: boolean;
    readonly overrideGetHist: boolean;
    readonly overrideGetCount: boolean;
    readonly overrideFilter: boolean;
    static ID: string;
    type: AttributeType;
    readonly id: string;
    options: {
        id: string;
        name: string;
    }[];
    private _attributeOption;
    private _dataKey;
    private _label;
    constructor();
    get attributeOption(): string;
    set attributeOption(value: string);
    get dataKey(): string;
    get label(): string;
    setupOptions(): Promise<void>;
    combineAgentsIntoString(agents: string[]): string;
    getDetailForSearchBar(): HTMLDivElement;
    getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]>;
    getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{
        bin: string;
        count: number;
    }[]>;
    getHistWithStorage(histType: HistRouteType, params: ICohortDBHistDataParms | ICohortDBHistScoreParms | ICohortDBHistScoreDepletionParms | ICohortDBHistPanelParms): Promise<{
        bin: string;
        count: number;
    }[]>;
    getCount(cohortDbId: number, filters?: IAllFilters): Promise<number>;
    filter(cht: Cohort, filter: INumRange[] | IEqualsList, label: string): Promise<Cohort>;
}
export declare function checkSpecialAttribute(attributeId: string): ISpecialAttribute;
