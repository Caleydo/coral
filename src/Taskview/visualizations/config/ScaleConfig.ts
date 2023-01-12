import { OptionGroup, Option, VisConfig } from './VisConfig';

const linearScale = new Option('Linear', true);
const logScale = new Option('Logarithmic', false);

export const scaleConfig = new OptionGroup('<i class="fas fa-chart-line"></i>', 'Scale', [linearScale, logScale]);

const absoluteData = new Option('Absolute Counts');
const relativeData = new Option('Relative Frequency', true);

export const dataConfig = new OptionGroup('', 'Show Data as', [absoluteData, relativeData]);

export const dataScaleConfig: VisConfig = {
  icon: '<i class="fas fa-chart-line"></i>',
  label: 'Data',
  groups: [scaleConfig, dataConfig],
};
