import { View as VegaView } from 'vega';
import { TopLevelSpec as VegaLiteSpec } from 'vega-lite';
import { Cohort } from '../../Cohort';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute, IdValuePair } from '../../data/Attribute';
import { IEqualsList, INumRange, NumRangeOperators } from '../../rest';
import { Option, VisConfig } from './config/VisConfig';
import { IVisualization } from './IVisualization';
export declare const MISSING_VALUES_LABEL = "Missing Values";
export declare const FACETED_CHARTS_WIDTH = 520;
export interface IVegaVisualization extends IVisualization {
    getSpec(gdata: IdValuePair[]): Partial<VegaLiteSpec>;
    showImpl(chart: HTMLDivElement, data: Array<IdValuePair>): any;
}
export declare abstract class AVegaVisualization implements IVegaVisualization {
    protected vegaLiteOptions: Object;
    static readonly NAME: string;
    static readonly SELECTION_SIGNAL_NAME = "selected";
    static readonly SELECTION_STORE: string;
    static readonly HIGHLIGHT_SIGNAL_NAME = "highlight";
    static readonly DATA_STORE_0 = "data_0";
    static readonly DATA_STORE_1 = "data_1";
    static readonly DATA_STORE_3 = "data_3";
    static readonly SPLITVALUE_DATA_STORE = "splitvalues";
    protected container: HTMLDivElement;
    protected chart: HTMLDivElement;
    protected controls: HTMLDivElement;
    protected legend: HTMLParagraphElement;
    protected nullValueContainer: HTMLDivElement;
    protected data: any;
    protected cohorts: Cohort[];
    protected vegaLiteSpec: any;
    protected vegaSpec: any;
    protected vegaView: VegaView;
    protected showBrush: boolean;
    protected colorPalette: string[];
    protected config: VisConfig[];
    constructor(vegaLiteOptions?: Object);
    clearSelection(): void;
    hasSelectedData(): boolean;
    getSpec(data: IdValuePair[]): Partial<VegaLiteSpec>;
    addHoverSelection(spec: any): void;
    addIntervalSelection(spec: any): void;
    setLogScale(spec: any, axis: 'x' | 'y'): void;
    getFilterRange(axis: 'x' | 'y'): any[];
    addMultiSelection(spec: any): void;
    addColorLegend(): void;
    getNullCheckboxState(attribute: IAttribute): boolean;
    abstract getSelectedData(): {
        from: string | number;
        to: string | number;
        cohort: ICohort;
    }[];
    abstract show(container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): any;
    abstract filter(): void;
    abstract split(): void;
    abstract showImpl(chart: HTMLDivElement, data: Array<IdValuePair>): any;
    destroy(): void;
    getConfig(): VisConfig[];
    selectOption(o: Option): void;
    getCategoricalFilter(categories: string[]): IEqualsList;
    getNumericalFilterAllInclusive(lower: number, upper: number): INumRange;
    getStandardNumericalFilter(lower: number, upper: number): INumRange;
    getGeneralNumericalFilter(lower: number, upper: number, lowerOperator?: NumRangeOperators, upperOperator?: NumRangeOperators): INumRange;
}
export declare abstract class SingleAttributeVisualization extends AVegaVisualization {
    protected type: 'quantitative' | 'nominal' | 'ordinal';
    /**
     * The displayed attribute
     */
    protected attribute: IAttribute;
    /**
     * Vega name of the displayed attribute, might be different to attribute.dataKey due to transformation (e.g. density transform)
     */
    protected field: string;
    protected colorPalette: string[];
    protected hideVisualization: boolean;
    protected nullValueMap: Map<string, Map<Cohort, number>>;
    show(container: HTMLDivElement, attributes: IAttribute[], cohorts: Cohort[]): Promise<void>;
    getData(): Promise<(IdValuePair & {
        Cohort: string;
    })[][]>;
    showImpl(chart: HTMLDivElement, data: Array<IdValuePair>): Promise<void>;
    getNullValueSelectedData(cohort: ICohort, attribute: IAttribute): {
        from: string | number;
        to: string | number;
        cohort: ICohort;
    };
    /**
     * Creates a IFilterDesc for every Cohort.
     * To do so we have to merge the categories or numranges we get for a cohort (multiple object) into one IFilterDesc, which makes this method a lot longer than split()
     * There can only be one IFilterDesc for the same cohort, but this can contain multiple categories, i.e. filter ALL down to a new cohort with all male&female items
     */
    filter(): void;
    /**
     * Creates a IFilterDesc for every Cohort/Category or Cohort/NumRange combination.
     * This means there can be multiple IFilterDesc for the same cohort (different categories, or multiple ranges (5-10, 10-15, and 30-40))
     * Splitting a cohort is only possible by single categories, i.e. you can't split ALL into a "asian/african" and a "white/american indian" cohort ( 2 categories each)
     */
    split(): void;
    protected splitValues: Array<{
        x: number;
    }>;
    addIntervalControls(): void;
    /**
     * Returns split or filter, depending on the currently active task tab
     */
    protected getActiveTask(): 'filter' | 'split';
    protected toggleFilterSplitMarks(newTask: 'filter' | 'split'): void;
    addCategoricalControls(): void;
    handleBinChangeEvent(event: any): void;
    protected vegaBrushListener: (name: any, value: any) => void;
    protected vegaSplitListener: (name: any, value: any) => void;
    handleInputIntervalEvent(event: any): void;
    protected scaleRange(range: [number, number] | []): number[];
    getBrushRange(): [number, number] | [];
    handleVegaIntervalEvent(name: any, value: any): void;
    handleSplitDragEvent(name: any, value: any): void;
}
