import { Cohort } from '../../Cohort';
import { ADataColumn } from './AColumn';
export default class PrevalenceColumn extends ADataColumn {
    private reference;
    constructor(reference: Cohort, $container: HTMLDivElement);
    setCellContent(cell: HTMLDivElement, cht: Cohort): Promise<void>;
}
