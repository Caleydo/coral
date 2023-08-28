import { IAllFilters } from 'tdp_core';
import { IServerColumn } from 'visyn_core/base';
import { IDataSubtypeConfig } from 'tdp_publicdb';
import { ICohort } from '../app/interfaces';
import { INumRange, IEqualsList, HistRouteType } from '../base/interfaces';
import { ICohortDBHistDataParms, ICohortDBHistPanelParms, ICohortDBHistScoreDepletionParms, ICohortDBHistScoreParms } from '../base/rest';

export interface ISearchBarGroup {
  groupLabel: string;
  data: Array<IOption>;
}

export type OptionType = 'dbc' | 'gene' | 'panel';

export interface IOption {
  // id: string;
  optionId: string; // e.g. gender or ensg00000141510
  optionType: OptionType; // e.g. dbc or gene
  optionText: string; // e.g. Gender or TP53
  optionData?: {
    [key: string]: any; // keys are always strings, so we just specify it to be key/value pairs with values of any type
  };
}

export interface IPanelOption extends IOption {
  optionData: {
    description: string; // e.g. "Cancer Cell Line Encyclopedia"
    species: string; // e.g. human
  };
}

export type ScoreType = 'depletion' | 'expression' | 'copy_number' | 'mutation';
export interface IScoreOption extends IOption {
  optionData: {
    type: ScoreType; // id of = IDataTypeConfig;
    subType: IDataSubtypeConfig;
  };
}

export interface IServerColumnOption extends IOption {
  optionData: {
    serverColumn: IServerColumn;
  };
}

export type AttributeType = 'categorical' | 'number' | 'string';

export type IdValuePair = {
  id: string;
  [key: string]: any;
};

export interface IAttributeJSON {
  option: IOption;
  currentDB: string;
  currentView: string;
}

/**
 * base type for ServerColumns and ScoreColumn
 * id, view, and database are needed for the methods in rest.ts
 */
export interface IAttribute {
  /**
   * id database access the data
   */
  id: string;

  /**
   * datakey with which the attributes data can be accessed frontend
   * necessary as GeneScoreAttributes have the same id for TPM, Copy Number, etc of the same gene
   */
  dataKey: string;

  /**
   * view to access the data
   */
  view: string;

  /**
   * database to access the data
   */
  database: string;

  /**
   * label of this column for display to the user by default the column name
   */
  label: string;

  /**
   * column type
   */
  type: AttributeType;

  /**
   * the categories in case of type=categorical
   */
  categories?: string[];

  /**
   * the minimal value in case of type=number
   */
  min?: number;

  /**
   * the maxmial value in case of type=number
   */
  max?: number;

  /**
   * wether the attribute is best shown on a log scale
   */
  preferLog: boolean;

  getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]>; // IRow has _id but IScoreRow has not

  getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{ bin: string; count: number }[]>;

  getHistWithStorage(
    histType: HistRouteType,
    params: ICohortDBHistDataParms | ICohortDBHistScoreParms | ICohortDBHistScoreDepletionParms | ICohortDBHistPanelParms,
  ): Promise<{ bin: string; count: number }[]>;

  getCount(cohortDbId: number, filters?: IAllFilters): Promise<number>;

  filter(cht: ICohort, filter: INumRange[] | IEqualsList, rangeLabel?: string, autofilter?: boolean, newCohortId?: number): Promise<ICohort>;

  toJSON();
}
