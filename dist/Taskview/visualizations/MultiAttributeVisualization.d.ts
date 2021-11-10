import { Cohort } from '../../Cohort';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute, IdValuePair } from '../../data/Attribute';
import { AVegaVisualization } from './AVegaVisualization';
export declare abstract class MultiAttributeVisualization extends AVegaVisualization {
    /**
     * The displayed attribute
     */
    protected attributes: IAttribute[];
    /**
     * Vega name of the displayed attribute, might be different to attribute.datakey due to transformation (e.g. density transform)
     */
    protected fields: string[];
    protected colorPalette: string[];
    protected nullValueMap: Map<string, Map<Cohort, number>>;
    show(container: HTMLDivElement, attributes: IAttribute[], cohorts: Cohort[]): Promise<void>;
    protected addControls(): void;
    /**
     * Returns split or filter, depending on the currently active task tab
     */
    protected getActiveTask(): 'filter' | 'split';
    protected toggleFilterSplitMarks(newTask: 'filter' | 'split'): void;
    protected splitValues: any[];
    protected addIntervalControls(attribute: IAttribute | string, axis: AxisType): void;
    addNullCheckbox(attribute: string): void;
    protected splitValuesX: any[];
    protected splitValuesY: any[];
    handleBinChangeEvent(event: any): void;
    protected vegaBrushListener: (name: any, value: any) => void;
    protected vegaSplitListener: (name: any, value: any) => void;
    protected axes: Array<AxisType>;
    handleInputIntervalEvent(event: any): void;
    getInterval(axis: AxisType): number[];
    handleVegaIntervalEvent(name: any, interval: object): void;
    handleSplitDragEvent(name: any, value: any): void;
    showImpl(chart: HTMLDivElement, data: Array<IdValuePair>): Promise<void>;
    getSelectedData(): {
        from: string | number;
        to: string | number;
        cohort: ICohort;
    }[];
}
export declare type AxisType = 'x' | 'y';
