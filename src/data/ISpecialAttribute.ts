import { IAllFilters } from 'tdp_core';
import {
  HistRouteType,
  ICohortDBHistDataParms,
  ICohortDBHistScoreParms,
  ICohortDBHistScoreDepletionParms,
  ICohortDBHistPanelParms,
  ICohort,
  INumRange,
  IEqualsList,
} from '../index';
import { AttributeType, IdValuePair } from './IAttributue';

export interface ISpecialAttribute {
  readonly overrideSearchBarDetails: boolean;
  readonly overrideGetData: boolean;
  readonly overrideGetHist: boolean;
  readonly overrideGetCount: boolean;
  readonly overrideFilter: boolean;

  /**
   * id database access the data
   */
  readonly id: string;

  label: string;
  type: AttributeType;
  dataKey: string;
  /**
   * Possible options the attribute could be formated
   */
  options: { id: string; name: string }[];

  /**
   * Option that is should be used to format the data
   */
  attributeOption: string;

  getDetailForSearchBar(): HTMLDivElement;

  getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]>; // IRow has _id but IScoreRow has not

  getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{ bin: string; count: number }[]>;

  getHistWithStorage(
    histType: HistRouteType,
    params: ICohortDBHistDataParms | ICohortDBHistScoreParms | ICohortDBHistScoreDepletionParms | ICohortDBHistPanelParms,
  ): Promise<{ bin: string; count: number }[]>;

  getCount(cohortDbId: number, filters?: IAllFilters): Promise<number>;

  filter(cht: ICohort, filter: INumRange[] | IEqualsList, label: string): Promise<ICohort>;
}
