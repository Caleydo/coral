/**
 * Enumeration for the different types of task
 */
export var TaskType;
(function (TaskType) {
    TaskType[TaskType["Filter"] = 0] = "Filter";
    TaskType[TaskType["Split"] = 1] = "Split";
    TaskType[TaskType["Combine"] = 2] = "Combine";
    TaskType[TaskType["Overview"] = 3] = "Overview";
    TaskType[TaskType["Characterization"] = 4] = "Characterization";
})(TaskType || (TaskType = {}));
//////////////////////////////////////////////////////////////
//
// Cohort Overview Elements (Cohort & Task)
//
//////////////////////////////////////////////////////////////
/**
 * Interface for every element in the overview (except the paths between the elements)
 */
export var ElementProvType;
(function (ElementProvType) {
    ElementProvType["Cohort"] = "Cohort";
    ElementProvType["TaskSplit"] = "Task-Split";
    ElementProvType["TaskFilter"] = "Task-Filter";
})(ElementProvType || (ElementProvType = {}));
//# sourceMappingURL=CohortInterfaces.js.map