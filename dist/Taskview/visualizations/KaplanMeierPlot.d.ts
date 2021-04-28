import { TopLevelSpec as VegaLiteSpec } from 'vega-lite';
import { IdValuePair } from '../../data/Attribute';
import { SingleAttributeVisualization } from './AVegaVisualization';
import { ICohort } from '../../CohortInterfaces';
export declare class KaplanMeierPlot extends SingleAttributeVisualization {
    static readonly NAME = "Kaplan Meier Plot";
    static readonly SURVIVAL = "survival";
    static readonly TIME = "days";
    static readonly ERROR = "error_95";
    protected readonly type = "quantitative";
    private days2death;
    private censoring;
    constructor(vegaLiteOptions?: Object);
    getData(): Promise<(IdValuePair & {
        Cohort: string;
    })[][]>;
    getSpec(data: IdValuePair[]): VegaLiteSpec;
    /**
     * Arquero Resources:
     *  https://sphweb.bumc.bu.edu/otlt/mph-modules/bs/bs704_survival/bs704_survival4.html
     *  https://towardsdatascience.com/kaplan-meier-curves-c5768e349479
     *  Test calculations: https://observablehq.com/d/5426a198a7a2dca7
     */
    convertData(data: IdValuePair[]): any;
    /**
     * From == To for categorical data, e.g. FROM: male, TO: male
     * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
     */
    getSelectedData(): {
        cohort: ICohort;
        from: string | number;
        to: string | number;
    }[];
}
