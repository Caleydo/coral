import { TopLevelSpec as VegaLiteSpec } from 'vega-lite';
import { ICohort } from '../../CohortInterfaces';
import { IdValuePair } from '../../data/Attribute';
import { SingleAttributeVisualization } from './AVegaVisualization';
export declare class VegaHistogram extends SingleAttributeVisualization {
    static readonly NAME = "Histogram";
    sort: string;
    getSpec(data: IdValuePair[]): VegaLiteSpec;
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
