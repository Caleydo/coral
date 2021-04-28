import { TopLevelSpec as VegaLiteSpec } from 'vega-lite';
import { InlineDataset } from 'vega-lite/build/src/data';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute, IdValuePair } from '../../data/Attribute';
import { MultiAttributeVisualization } from './MultiAttributeVisualization';
export declare class GroupedBoxplot extends MultiAttributeVisualization {
    static readonly NAME = "Boxplot";
    catAttribute: IAttribute;
    numAttribute: IAttribute;
    brushData: InlineDataset;
    constructor(vegaLiteOptions?: Object);
    showImpl(chart: HTMLDivElement, data: Array<IdValuePair>): Promise<void>;
    getSpec(data: IdValuePair[]): VegaLiteSpec;
    generateSpec(catAttribute: IAttribute, numAttribute: IAttribute): Partial<import("vega-lite/build/src/spec").TopLevelFacetSpec>;
    addIntervalSelection(spec: any): void;
    protected addIntervalControls(attributeLabel: string, axis: any): void;
    handleInputIntervalEvent(event: any): void;
    handleVegaIntervalEvent(name: any, interval: object): void;
    clearSelection(): void;
    getSelectedData(): {
        cohort: ICohort;
        from: string | number;
        to: string | number;
    }[];
    filter(): void;
    split(): void;
}
