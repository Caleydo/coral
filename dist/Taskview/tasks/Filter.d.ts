import { Selection } from 'd3-selection';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute } from '../../data/Attribute';
import { AVegaVisualization } from '../visualizations/AVegaVisualization';
import { ATask } from './ATask';
export declare class Filter extends ATask {
    label: string;
    id: string;
    hasOutput: boolean;
    vis: AVegaVisualization;
    $visContainer: HTMLDivElement;
    controls: Selection<HTMLDivElement, any, null, undefined>;
    private eventID;
    visualizations: {
        new (): AVegaVisualization;
    }[];
    attributes: IAttribute[];
    cohorts: ICohort[];
    supports(attributes: IAttribute[], cohorts: ICohort[]): boolean;
    showSearchBar(): boolean;
    show(container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): Promise<void>;
    addVisSelector(): void;
    private show1Attribute;
    private show2Attributes;
    private showTsne;
    set title(title: string);
    setVisualizations(visualizations: {
        new (): AVegaVisualization;
    }[]): void;
    showWithVis(vis: AVegaVisualization): Promise<void>;
}
