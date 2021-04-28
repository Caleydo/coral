import { Cohort } from '../../Cohort';
import { SortType } from '../../util';
import { ADataColumn } from './AColumn';
/**
 * Displays cohorts with their given representation as a column
 */
export declare abstract class ACohortColumn extends ADataColumn {
    sortElemIcon: HTMLElement;
    protected currSortOptIdx: number;
    sortOptions: {
        idx: number;
        type: SortType;
        icon: string;
        active: boolean;
        next: number;
    }[];
    constructor(title: any, $container: HTMLDivElement, closeable?: boolean);
    setCellContent(cell: HTMLDivElement, cht: Cohort): Promise<void>;
    setDefaultSort(): void;
    private getSortOption;
    private changeSortOption;
    addSortButton(): void;
    protected abstract sortCohorts(type: SortType): any;
}
export declare class InputCohortColumn extends ACohortColumn {
    init: boolean;
    constructor($container: HTMLDivElement);
    setCohorts(cohorts: Cohort[]): void;
    sortCohorts(type: SortType): void;
}
export declare class OutputCohortColumn extends ACohortColumn {
    cohorts: Cohort[];
    init: boolean;
    constructor($container: HTMLDivElement);
    setCohorts(cohorts: Cohort[]): void;
    sortCohorts(type: SortType): void;
}
