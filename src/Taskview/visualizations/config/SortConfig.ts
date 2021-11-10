import {OptionGroup, Option, VisConfig} from './VisConfig';


const sortRowsAscending = new Option('Ascending');
const sortRowsDescending = new Option('Descending', true);

export const sortOrderConfig = new OptionGroup('<i class="fas fa-sort"></i>', 'Sort Order', [sortRowsAscending, sortRowsDescending]);

const sortRowsByName = new Option('Name');
const sortRowsByAverage = new Option('Average');
const sortRowsByMaxium = new Option('Maximum', true);
const sortRowsByVariance = new Option('Spread');

export const sortByConfig = new OptionGroup('<i class="fas fa-ruler"></i>', 'Sort Categories by', [sortRowsByName, sortRowsByAverage, sortRowsByMaxium, sortRowsByVariance]);

export const sortConfig: VisConfig = {
  icon: '<i class="fas fa-sort-amount-down-alt"></i>',
  label: 'Sort',
  groups: [sortOrderConfig, sortByConfig]
};
