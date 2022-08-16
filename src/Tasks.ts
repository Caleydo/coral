import { IAllFilters, IParams } from 'tdp_core';
import { ElementProvType, IElement, IElementProvJSON, IElementProvJSONTask, ITask, ITaskRep, TaskType } from './CohortInterfaces';
import { IAttribute, toAttribute } from './data/Attribute';
import { deepCopy, log } from './util';

export abstract class Task implements ITask {
  id: string;

  label: string;

  type: TaskType;

  parents: Array<IElement>;

  children: Array<IElement>;

  representation: ITaskRep;

  attributes: IAttribute[];

  creationDate: number;

  constructor(id: string, label: string, attributes: IAttribute[]) {
    this.id = id;
    this.label = label;
    this.creationDate = Date.now();
    this.representation = null;
    this.children = [];
    this.parents = [];
    this.attributes = attributes;
  }

  abstract toProvenanceJSON(): IElementProvJSONTask;
}

export class TaskFilter extends Task {
  constructor(id: string, label: string, attributes: IAttribute[]) {
    super(id, label, attributes);
    this.type = TaskType.Filter;
  }

  public toProvenanceJSON(): IElementProvJSONTask {
    return {
      id: this.id,
      type: ElementProvType.TaskFilter,
      label: this.label,
      parent: this.parents.map((elem) => elem.id),
      children: this.children.map((elem) => elem.id),
      attrAndValues: {
        attributes: this.attributes.map((elem) => elem.toJSON()),
      },
    };
  }
}

export class TaskSplit extends Task {
  constructor(id: string, label: string, attributes: IAttribute[]) {
    super(id, label, attributes);
    this.type = TaskType.Split;
  }

  public toProvenanceJSON(): IElementProvJSONTask {
    return {
      id: this.id,
      type: ElementProvType.TaskSplit,
      label: this.label,
      parent: this.parents.map((elem) => elem.id),
      children: this.children.map((elem) => elem.id),
      attrAndValues: {
        attributes: this.attributes.map((elem) => elem.toJSON()),
      },
    };
  }
}

export function createTaskFromProvJSON(config: IElementProvJSON): Task {
  const attrJSON = config.attrAndValues.attributes;
  const attributes = attrJSON.map((elem) => {
    return toAttribute(elem.option, elem.currentDB, elem.currentView);
  });

  if (config.type === ElementProvType.TaskFilter) {
    return new TaskFilter(config.id, config.label, attributes);
  }
  return new TaskSplit(config.id, config.label, attributes);
}

function mergerAllFilterPart(filterType: FilterType, existingFilter: IParams, newFilter: IParams): IParams {
  let mergedFilter = deepCopy(existingFilter);
  // const currType : FilterType = FilterType.normal;
  let filterContradiction = false;
  // go through all attribuets of the new filter
  for (const attr in newFilter) {
    // check if attribute exists in the new filter
    if (Object.prototype.hasOwnProperty.call(newFilter, attr)) {
      // check if attribute exists in the existing filter
      if (Object.prototype.hasOwnProperty.call(existingFilter, attr)) {
        const newVal = newFilter[attr]; // current value for attribute
        const existVal = existingFilter[attr]; // current value for attribute

        if (filterType === FilterType.normal) {
          // convert newVal to an array of values
          const newValArray = Array.isArray(newVal) ? (newVal as string[] | number[] | boolean[]) : new Array(newVal as string | number | boolean);
          // convert existVal to an array of values
          const existValArray = Array.isArray(existVal) ? (existVal as string[] | number[] | boolean[]) : new Array(existVal as string | number | boolean);
          // if all new values are part of the existing values, then the filter is OK
          for (const nv of newValArray) {
            if (!existValArray.includes(nv)) {
              filterContradiction = true;
            }
          }
          // no filter contradiction -> new filter values can be used
          if (!filterContradiction) {
            // outside of for-loop
            mergedFilter[attr] = newFilter[attr];
          }
        } else if (filterType === FilterType.lt || filterType === FilterType.lte) {
          // smaller is OK
          if (newVal <= existVal) {
            mergedFilter[attr] = newFilter[attr];
          } else {
            filterContradiction = true;
          }
        } else if (filterType === FilterType.gt || filterType === FilterType.gte) {
          // bigger is OK
          if (newVal >= existVal) {
            mergedFilter[attr] = newFilter[attr];
          } else {
            filterContradiction = true;
          }
        }
      } else {
        // the new filter attribute is not existing -> add to the resulting filter
        mergedFilter[attr] = newFilter[attr];
      }
    }
  }

  if (filterContradiction) {
    mergedFilter = null;
  }
  log.debug('Filter Contradiction: ', filterContradiction);
  return mergedFilter;
}

export function mergeTwoAllFilters(existingFilter: IAllFilters, newFilter: IAllFilters): IAllFilters {
  let mergerAllFilter: IAllFilters = null;
  if (existingFilter !== null) {
    const normal: IParams = mergerAllFilterPart(FilterType.normal, existingFilter.normal, newFilter.normal);
    const lt: IParams = mergerAllFilterPart(FilterType.lt, existingFilter.lt, newFilter.lt);
    const lte: IParams = mergerAllFilterPart(FilterType.lte, existingFilter.lte, newFilter.lte);
    const gt: IParams = mergerAllFilterPart(FilterType.gt, existingFilter.gt, newFilter.gt);
    const gte: IParams = mergerAllFilterPart(FilterType.gte, existingFilter.gte, newFilter.gte);

    // if the filters are all !== null, that means there is no filter contradiction -> set all filters of mergerAllFilter
    // otherwise the mergerAllFilter stays null
    if (normal !== null && lte !== null && lte !== null && gt !== null && gte !== null) {
      mergerAllFilter = {
        normal,
        lt,
        lte,
        gt,
        gte,
      };
    }
  }

  return mergerAllFilter;
}

enum FilterType {
  normal,
  lt,
  lte,
  gt,
  gte,
}
