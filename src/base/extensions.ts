import {IStartMenuDatasetSectionDesc} from 'ordino';
import {IDataSourceConfig} from '../common';

interface IStartMenuDatasetSectionTab {
  /**
   * Unique id of the tab
   */
  id: string;

  /**
   * Title of the tab
   */
  name: string;

  /**
   * Font Awesome icon of the tab
   * @see https://fontawesome.com/
   * @example `fas fa-male`
   */
  icon: string;
}

export interface IPublicDbStartMenuDatasetSectionDesc extends IStartMenuDatasetSectionDesc {
  /**
   * List of tabs for the dataset section
   */
  tabs: IStartMenuDatasetSectionTab[];

  /**
   * Data source object
   */
  dataSource: IDataSourceConfig;

  /**
   * Optional CSS class to add to the section
   */
  cssClass?: string;

  /**
   * Optional token separators. Used to split the text pasted on the `DatasetSearchBox`
   */
  tokenSeparators?: RegExp;
}
