import { OptionGroup, Option, VisConfig } from './VisConfig';

const confidence95 = new Option('95% Confidence Intervals', true);
export const confidenceNone = new Option('Hide Confidence Intervals');

export const confidenceToggleGroup = new OptionGroup('', 'Confidence Intervals', [confidence95, confidenceNone]);
