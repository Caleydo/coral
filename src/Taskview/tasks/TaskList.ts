import {ATask} from './ATask';
import {Compare} from './Compare';
import {Details} from './Details';
import {Filter} from './Filter';
import {Prevalence} from './Prevalence';

export const TASKLIST: Array<ATask> = [
  new Filter(),
  new Details(),
  new Prevalence(),
  new Compare()
]; // Add new tasks to this array
