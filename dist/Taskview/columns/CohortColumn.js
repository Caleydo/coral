import { select } from 'd3v7';
import { OnboardingManager } from '../../OnboardingManager';
import { SortType } from '../../util';
import { ColumnSortEvent } from '../../utilCustomEvents';
import { ADataColumn } from './AColumn';
/**
 * Displays cohorts with their given representation as a column
 */
export class ACohortColumn extends ADataColumn {
    constructor(title, $container, closeable = false) {
        super(title, $container, closeable);
        this.sortOptions = [
            { idx: 1, type: SortType.Default, icon: 'fas fa-sort-alpha-down', active: false, next: 2 },
            { idx: 2, type: SortType.Alpha_AZ, icon: 'fas fa-sort-alpha-down', active: true, next: 3 },
            { idx: 3, type: SortType.Alpha_ZA, icon: 'fas fa-sort-alpha-up', active: true, next: 4 },
            { idx: 4, type: SortType.Size_91, icon: 'fas fa-sort-amount-down', active: true, next: 5 },
            { idx: 5, type: SortType.Size_19, icon: 'fas fa-sort-amount-up', active: true, next: 1 },
        ];
        this.$column.classList.add('cohort');
        this.currSortOptIdx = 1; // default sort
        this.addSortButton();
    }
    async setCellContent(cell, cht) {
        const clone = cht.representation.getClone();
        cell.appendChild(clone); // Using appendChild (instead of innerHTML) is important to keep track of 'checked' attributes and others
        cell.style.padding = '2px';
    }
    setDefaultSort() {
        this.changeSortOption(this.getSortOption(1));
    }
    getSortOption(idx) {
        return this.sortOptions.filter((opt) => opt.idx === idx)[0];
    }
    changeSortOption(sortOpt) {
        this.currSortOptIdx = sortOpt.idx;
        this.sortElemIcon.className = sortOpt.icon;
        this.sortElemIcon.classList.add('options');
        this.sortElemIcon.classList.toggle('active', sortOpt.active);
    }
    addSortButton() {
        // button for name
        const initSort = this.getSortOption(this.currSortOptIdx);
        this.sortElemIcon = select(this.$headerOptions).append('i').node();
        this.sortElemIcon.setAttribute('aria-hidden', 'true');
        this.changeSortOption(initSort);
        this.sortElemIcon.title = 'Sort';
        this.sortElemIcon.addEventListener('click', () => {
            const currSort = this.getSortOption(this.currSortOptIdx);
            const nextSort = this.getSortOption(currSort.next);
            this.changeSortOption(nextSort);
            this.sortCohorts(nextSort.type);
        });
    }
}
export class InputCohortColumn extends ACohortColumn {
    constructor($container) {
        super('Input Cohorts', $container);
        this.init = true;
        this.$column.classList.add('first');
    }
    setCohorts(cohorts) {
        if (this.init && cohorts.length > 0) {
            this.init = false;
            OnboardingManager.addTip('input', this.$header);
        }
        super.setCohorts(cohorts);
    }
    sortCohorts(type) {
        this.$column.dispatchEvent(new ColumnSortEvent(type, true));
    }
}
export class OutputCohortColumn extends ACohortColumn {
    constructor($container) {
        super('Output Cohorts', $container);
        this.init = true;
        this.$column.classList.add('last');
    }
    setCohorts(cohorts) {
        this.cohorts = cohorts;
        super.setCohorts(cohorts);
        if (this.init && cohorts.length > 0) {
            this.init = false;
            OnboardingManager.addTip('output', this.$header);
        }
    }
    sortCohorts(type) {
        this.$column.dispatchEvent(new ColumnSortEvent(type, false));
    }
}
//# sourceMappingURL=CohortColumn.js.map