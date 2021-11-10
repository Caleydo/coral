import { Cohort } from '../../Cohort';
import Taskview from '../Taskview';
export declare abstract class AColumn {
    protected title: string;
    protected $container: HTMLDivElement;
    $column: HTMLDivElement;
    $header: HTMLDivElement;
    $headerTitle: HTMLDivElement;
    $headerOptions: HTMLDivElement;
    constructor(title: string, $container: HTMLDivElement, closeable?: boolean);
    close(): void;
    abstract setCohorts(cohorts: Cohort[]): any;
}
/**
 * Abstract base class of all data columns = columns with data to cohorts
 */
export declare abstract class ADataColumn extends AColumn {
    protected showLoadingAnimation: boolean;
    private dataCells;
    setCohorts(cohorts: Cohort[]): void;
    orderCohorts(cohorts: Cohort[]): void;
    setCell(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void>;
    setCellStyle(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void>;
    abstract setCellContent(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void>;
}
/**
 * Header and cells are empty, no options are shown
 * Shrinks down to 0px for the content, the border remains, and currently is 2px left, seperating the last input column from the task search and the last output column from the output cohorts
 */
export declare class EmptyColumn extends ADataColumn {
    constructor($container: HTMLDivElement);
    setCellContent(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void>;
}
export default class AddColumnColumn extends ADataColumn {
    private onInputCohortSide;
    constructor($container: HTMLDivElement, taskview: Taskview, database: string, view: string, onInputCohortSide?: boolean);
    setCellContent(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void>;
}
