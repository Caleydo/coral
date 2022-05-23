import {ATask} from './ATask';
import {Compare} from './Compare';
import {Details} from './Details';
import {Filter} from './Filter';
import {Prevalence} from './Prevalence';
import {Compadre} from './Compadre';

export const TASKLIST: Array<ATask> = [
  new Filter(),
  new Details(),
  new Prevalence(),
  new Compare(),
  new Compadre()
]; // Add new tasks to this array
