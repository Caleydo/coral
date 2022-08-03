import { Spec as VegaSpec } from 'vega';
export declare class ProbabilityScatterplot {
    private data;
    private cohorts;
    constructor(data: any, cohorts: any);
    getSpec(): VegaSpec;
}
