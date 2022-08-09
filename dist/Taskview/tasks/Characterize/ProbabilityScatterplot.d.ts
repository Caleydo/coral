import { Spec as VegaSpec, View } from 'vega';
export declare class ProbabilityScatterplot {
    private cohorts;
    view: View;
    data: any[];
    setView(view: View): void;
    setData(data: any[]): void;
    getData(): any[];
    constructor(data: any, cohorts: any);
    getSpec(): VegaSpec;
}
