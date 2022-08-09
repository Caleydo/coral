import * as LineUpJS from 'lineupjs';
import { Spec as VegaSpec, View } from 'vega';
export declare class ProbabilityScatterplot {
    private cohorts;
    private lineup;
    view: View;
    data: any[];
    setView(view: View): void;
    handleVegaIntervalEvent(name: any, value: any): void;
    setData(data: any[]): void;
    getData(): any[];
    constructor(data: any, cohorts: any, lineup: LineUpJS.Taggle);
    getSpec(): VegaSpec;
}
