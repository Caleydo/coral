import { IMeasureResult, ISetParameters, ISimilarityMeasure } from 'tourdino';
import { Cohort } from '../../Cohort';
import { Attribute, IAttribute } from '../../data/Attribute';
import { ATask } from './ATask';
export declare class Compare extends ATask {
    label: string;
    id: string;
    hasOutput: boolean;
    attributes: IAttribute[];
    cohorts: Cohort[];
    supports(attributes: IAttribute[], cohorts: Cohort[]): boolean;
    showSearchBar(): boolean;
    show(container: HTMLDivElement, attributes: IAttribute[], cohorts: Cohort[]): Promise<void>;
    appendTable(): void;
    updateTableDescription(isTableEmpty: boolean): any;
    updateTable(): void;
    appendLegend(): void;
    close(): void;
    /**
     *     For each attribute in rowAttributes, we want to comapre the rows inside colGroups with the rows of rowGroups
     *     i.e. the number of table rows is: |rowAttributes| * |rowGroups|
     *     and there are |colGroups| columns
     *     + plus the rows and columns where we put labels
     *
     * @param colGroups
     * @param rowGroups
     * @param rowAttributes
     * @param scaffold only create the matrix with row headers, but no value calculation
     * @param update
     */
    getTableBody(cohorts: Cohort[], attributes: Attribute[], scaffold: boolean, update: (bodyData: IScoreCell[][][]) => void): Promise<Array<Array<Array<IScoreCell>>>>;
    prepareDataArray(cohorts: Cohort[], attributes: Attribute[]): any[];
    toScoreCell(score: IMeasureResult, measure: ISimilarityMeasure, setParameters: ISetParameters): IScoreCell;
    createToolTip(tableCell: any): String;
    onClick(tableCell: any): void;
    onMouseOver(tableCell: any, state: boolean): void;
    private highlightSelectedCell;
    private visualizeSelectedCell;
    private generateVisualDetails;
    private removeCellDetails;
}
interface IScoreCell {
    key?: string;
    label: string;
    type?: string;
    background?: string;
    foreground?: string;
    rowspan?: number;
    colspan?: number;
    score?: IMeasureResult;
    measure?: ISimilarityMeasure;
    setParameters?: ISetParameters;
    highlightData?: IHighlightData[];
}
interface IHighlightData {
    column: string;
    label: string;
    category?: string;
    color?: string;
}
export declare function textColor4Background(backgroundColor: string): string;
export declare function score2color(score: number): {
    background: string;
    foreground: string;
};
export {};
