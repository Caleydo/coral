import { TopLevelSpec as VegaLiteSpec } from 'vega-lite';
import { Cohort } from '../../Cohort';
import { IAttribute, IdValuePair } from '../../data/Attribute';
import { AxisType, MultiAttributeVisualization } from './MultiAttributeVisualization';
import { TopLevel, LayerSpec } from 'vega-lite/build/src/spec';
import { Field } from 'vega-lite/build/src/channeldef';
export declare class Scatterplot extends MultiAttributeVisualization {
    static readonly NAME: string;
    protected checkAttributeType: boolean;
    constructor(vegaLiteOptions?: Object);
    getSpec(data: IdValuePair[]): VegaLiteSpec;
    showImpl(chart: HTMLDivElement, data: Array<IdValuePair>): Promise<void>;
    filter(): void;
    split(): void;
}
export declare class TsneScatterplot extends Scatterplot {
    static readonly NAME = "t-SNE Scatterplot";
    readonly ITERATIONS = 100;
    iteration: number;
    progressBar: HTMLDivElement;
    running: boolean;
    playBtn: any;
    inputData: number[][];
    tsne: any;
    progressWrapper: any;
    tsneClass: any;
    projData: any[];
    originalAttributes: IAttribute[];
    constructor(vegaLiteOptions?: Object);
    getSpec(data: IdValuePair[]): TopLevel<LayerSpec<Field>>;
    show(container: HTMLDivElement, attributes: IAttribute[], cohorts: Cohort[]): Promise<void>;
    showImpl(chart: HTMLDivElement, data: Array<IdValuePair>): Promise<void>;
    embeddStep(): Promise<void>;
    embeddArrToJson(projCoords: Array<Array<number>>): IdValuePair[];
    addProgressBar(): void;
    setProgress(iteration: number): void;
    run(run: boolean): void;
    protected addControls(): void;
    addIntervalControls(attribute: string, axis: AxisType): void;
    addNullCheckbox(attribute: string): void;
    filter(): void;
    split(): void;
}
