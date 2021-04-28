import { Cohort } from '../../Cohort';
import { ADataColumn } from './AColumn';
export default class NumberColumn extends ADataColumn {
    constructor($container: HTMLDivElement);
    setCellStyle(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void>;
    setCellContent(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void>;
}
