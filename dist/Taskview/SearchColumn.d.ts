import { Cohort } from '../Cohort';
import { ATask } from './tasks/ATask';
import Taskview from './Taskview';
export default class SearchColumn {
    private referenceCht;
    private taskview;
    private $searchColumn;
    private $taskContainer;
    private $tasks;
    private searchBar;
    private refCohort;
    private $ColumnHeader;
    activeTask: ATask;
    constructor($container: HTMLDivElement, referenceCht: Cohort, taskview: Taskview);
    clear(): void;
    private getSelectedAttributes;
    destroy(): void;
    private _setupSearchBar;
    private setSearchBarVisibility;
    updateTasks(): void;
    private updateTaskButtonState;
    private taskCloseListener;
    showTask(task: ATask): void;
    closeTask(task: any): void;
    private enableAddButtons;
}
