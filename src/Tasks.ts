import { IServerColumn } from 'visyn_core';
import { log } from './util';
import { EElementProvType, IElement, IElementProvJSON, IElementProvJSONTask, ITask, ITaskRep, TaskType } from './app/interfaces';
import { GeneScoreAttribute, PanelScoreAttribute, ServerColumnAttribute, SpecialAttribute } from './data/Attribute';
import type { IAttribute, IOption, IScoreOption, IServerColumnOption } from './data/IAttribute';
import type { ISpecialAttribute } from './data/ISpecialAttribute';

export interface ISpecialOption extends IServerColumnOption {
  optionData: {
    serverColumn: IServerColumn;
    sAttrId: string;
    attrOption: string;
    spAttribute: ISpecialAttribute;
  };
}

export function toAttribute(option: IOption, currentDB, currentView): IAttribute {
  if (option.optionType === 'dbc') {
    if (option.optionData && (option as ISpecialOption).optionData.spAttribute) {
      // Create Special Attribtues
      // if (option.optionData.spA === 'treatment') {
      log.debug('create special Attribute: ', option.optionId);
      log.debug('special Attribute object: ', option.optionData.spAttribute);
      return new SpecialAttribute(
        option.optionId,
        currentView,
        currentDB,
        (option as ISpecialOption).optionData.spAttribute,
        (option as ISpecialOption).optionData.attrOption,
      );
    }
    // Create Attribute
    return new ServerColumnAttribute(option.optionId, currentView, currentDB, (option as IServerColumnOption).optionData.serverColumn);
  }
  // Create ScoreAttribute
  if (option.optionType === 'gene') {
    return new GeneScoreAttribute(
      option.optionId,
      option.optionText,
      currentView,
      currentDB,
      (option as IScoreOption).optionData.type,
      (option as IScoreOption).optionData.subType,
    );
  }
  if (option.optionType === 'panel') {
    return new PanelScoreAttribute(option.optionId, currentView, currentDB, 'categorical');
  }
  return null;
}

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
