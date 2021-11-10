import { Cohort } from '../../Cohort';
import { IAttribute } from '../../data/Attribute';
import { ADataColumn } from './AColumn';
export default class AttributeColumn extends ADataColumn {
    attribute: IAttribute;
    private onInputCohortSide;
    private color;
    private hists;
    private showOutputChtHistRef;
    private _pinned;
    private togglePinBtn;
    private _order;
    constructor(attribute: IAttribute, $container: HTMLDivElement, onInputCohortSide?: boolean, color?: boolean, pinned?: boolean);
    updateCellContent(): void;
    get pinned(): boolean;
    set pinned(value: boolean);
    setOrder(incOrderValueBy: number): void;
    private addHighlightForColumn;
    private removeHighlightForColumn;
    setCellStyle(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void>;
    setCellContent(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void>;
}
