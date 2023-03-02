import { IAllFilters, IParams } from 'tdp_core';
import { EElementProvType, IElement, IElementProvJSON, IElementProvJSONTask, ITask, ITaskRep, TaskType } from './app/interfaces';
import { IAttribute } from './data/IAttributue';
import { toAttribute } from './data/interfaces';
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
      type: EElementProvType.TaskFilter,
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
      type: EElementProvType.TaskSplit,
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

  if (config.type === EElementProvType.TaskFilter) {
    return new TaskFilter(config.id, config.label, attributes);
  }
  return new TaskSplit(config.id, config.label, attributes);
}