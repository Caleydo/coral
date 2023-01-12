import { OptionGroup, Option, VisConfig } from './VisConfig';

const groupByCategory = new Option('Same Category', true);
const groupByCohort = new Option('Same Cohort');

// Group = Facet
export const groupByConfig = new OptionGroup('', 'Group Bars of', [groupByCohort, groupByCategory]);

export const groupConfig: VisConfig = {
  icon: '<i class="fas fa-sitemap fa-rotate-270"></i>',
  label: 'Group',
  groups: [groupByConfig],
};
