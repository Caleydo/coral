import { OptionGroup, Option } from './VisConfig';
const probability = new Option('Estimated Probability', true);
export const counts = new Option('Smoothed Counts');
export const countConfig = new OptionGroup('', 'Density Estimation', [probability, counts]);
//# sourceMappingURL=CountCounfig.js.map