export const COHORT_REMOVE_EVENT_TYPE = 'cht:remove';
export class CohortRemoveEvent extends CustomEvent {
    constructor(cohort) {
        super(COHORT_REMOVE_EVENT_TYPE, { detail: { cohort }, bubbles: true });
    }
}
export const TASK_REMOVE_EVENT_TYPE = 'task:remove';
export class TaskRemoveEvent extends CustomEvent {
    constructor(task) {
        super(TASK_REMOVE_EVENT_TYPE, { detail: { task }, bubbles: true });
    }
}
export const COHORT_SELECTION_EVENT_TYPE = 'cht:select';
export class CohortSelectionEvent extends CustomEvent {
    constructor(cohort, replaceSelection = false) {
        super(COHORT_SELECTION_EVENT_TYPE, { detail: { cohort, replaceSelection }, bubbles: true });
    }
}
export const COLUMN_CLOSE_EVENT_TYPE = 'cht:column:close';
export class ColumnCloseEvent extends CustomEvent {
    constructor(column) {
        super(COLUMN_CLOSE_EVENT_TYPE, { detail: { column }, bubbles: true });
    }
}
export const COLUMN_SORT_EVENT_TYPE = 'cht:column:sort';
export class ColumnSortEvent extends CustomEvent {
    constructor(type, sortInputChts) {
        super(COLUMN_SORT_EVENT_TYPE, { detail: { type, sortInputChts }, bubbles: true });
    }
}
export const CREATE_OUTPUT_COHORT_EVENT_TYPE = 'cht:create:output';
export class CreateOutputCohortEvent extends CustomEvent {
    constructor(cohort, originCohort) {
        super(CREATE_OUTPUT_COHORT_EVENT_TYPE, { detail: { cohort, origin: originCohort }, bubbles: true });
    }
}
export const FILTER_EVENT_TYPE = 'cht:filter';
export class FilterEvent extends CustomEvent {
    constructor(desc) {
        // Its actually the same as the SplitEvent
        // while  note checked,
        // * the splitevent can contain the same cohort multiple times, e.g., twice when splitting into male and female,
        // * the filterevent should contain each cohort once, the filter inside the filterdesc describes what should be kept.
        super(FILTER_EVENT_TYPE, { detail: { desc }, bubbles: true });
    }
}
export const SPLIT_EVENT_TYPE = 'cht:split';
export class SplitEvent extends CustomEvent {
    constructor(desc) {
        super(SPLIT_EVENT_TYPE, { detail: { desc }, bubbles: true });
    }
}
export const CONFIRM_OUTPUT_EVENT_TYPE = 'cht:output:confirm';
export class ConfirmOutputEvent extends CustomEvent {
    constructor(cohorts) {
        super(CONFIRM_OUTPUT_EVENT_TYPE, { detail: { cohorts }, bubbles: true });
    }
}
export const CONFIRM_TASK_EVENT_TYPE = 'cht:task:confirm';
export class ConfirmTaskEvent extends CustomEvent {
    constructor(params, attributes) {
        super(CONFIRM_TASK_EVENT_TYPE, { detail: { params, attributes }, bubbles: true });
    }
}
export const OVERVIEW_PREVIEW_CHANGE_EVENT_TYPE = 'cht:ov:preview:change';
export class PreviewChangeEvent extends CustomEvent {
    constructor(params, attributes) {
        super(OVERVIEW_PREVIEW_CHANGE_EVENT_TYPE, { detail: { params, attributes }, bubbles: true });
    }
}
export const OVERVIEW_PREVIEW_CONFIRM_EVENT_TYPE = 'cht:ov:preview:confirm';
export class PreviewConfirmEvent extends CustomEvent {
    constructor(params, attributes) {
        super(OVERVIEW_PREVIEW_CONFIRM_EVENT_TYPE, { detail: { params, attributes }, bubbles: true });
    }
}
//# sourceMappingURL=utilCustomEvents.js.map