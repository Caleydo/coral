import { ATask } from './ATask';
import { Compare } from './Compare';
import { Details } from './Details';
import { Filter } from './Filter';
import { Prevalence } from './Prevalence';
import {Characterize} from './Characterize';


export const TASKLIST: Array<ATask> = [new Filter(), new Details(), new Prevalence(), new Compare(), new Characterize()]; // Add new tasks to this array
