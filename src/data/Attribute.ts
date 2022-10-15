import { IAllFilters, IServerColumn } from 'tdp_core';
import { IDataSubtypeConfig, IDataTypeConfig, resolveDataTypes } from 'tdp_publicdb';
import {
  Cohort,
  createCohortWithDepletionScoreFilter,
  createCohortWithEqualsFilter,
  createCohortWithGeneEqualsFilter,
  createCohortWithGeneNumFilter,
  createCohortWithNumFilter,
  createCohortWithPanelAnnotationFilter,
} from '../Cohort';
import { ICohort } from '../CohortInterfaces';
import {
  getCohortData,
  getCohortDepletionScore,
  getCohortGeneScore,
  getCohortHist,
  getCohortPanelAnnotation,
  getCohortSize,
  HistRouteType,
  ICohortDBDepletionScoreParams,
  ICohortDBGeneScoreParams,
  ICohortDBHistDataParms,
  ICohortDBHistPanelParms,
  ICohortDBHistScoreDepletionParms,
  ICohortDBHistScoreParms,
  ICohortDBPanelAnnotationParams,
  IEqualsList,
  INumRange,
} from '../base/rest';
import { IOption, IScoreOption, IServerColumnOption, ISpecialOption, OptionType } from '../Taskview/SearchBar';
import { deepCopy, getSessionStorageItem, IAttributeFilter, log, setSessionStorageItem } from '../util';
import { easyLabelFromFilter, easyLabelFromFilterArray, niceName } from '../utils/labels';
import { ISpecialAttribute } from './SpecialAttribute';

export type AttributeType = 'categorical' | 'number' | 'string';

export type ScoreType = 'depletion' | 'expression' | 'copy_number' | 'mutation';

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

  filter(cht: ICohort, filter: INumRange[] | IEqualsList): Promise<Cohort>;

  toJSON();
}

export abstract class Attribute implements IAttribute {
  public preferLog = false;

  public min?: number;

  public max?: number;

  public categories?: string[];

  public label: string;

  public dataKey: string;

  constructor(public readonly id: string, public readonly view: string, public readonly database: string, public readonly type: AttributeType) {
    this.label = niceName(this.id); // default
    this.dataKey = this.id; // identical by default
    // console.log('attribute Option: ', option);
    // console.log('attribute JSON: ', this.toJSON());
  }

  async getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]> {
    const rows = await getCohortData({ cohortId: cohortDbId, attribute: this.id });
    return rows;
  }

  getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{ bin: string; count: number }[]> {
    const params: ICohortDBHistDataParms = {
      cohortId: dbId,
      attribute: this.id,
    };
    const type = this.type === 'number' ? HistRouteType.dataNum : HistRouteType.dataCat;

    return this.getHistWithStorage(type, params);
  }

  async getHistWithStorage(
    histType: HistRouteType,
    params: ICohortDBHistDataParms | ICohortDBHistScoreParms | ICohortDBHistScoreDepletionParms | ICohortDBHistPanelParms,
  ): Promise<{ bin: string; count: number }[]> {
    // define storagekey as cohort dbId and attribute label
    const storageKey = `${params.cohortId}#${this.label}`;
    let histData: { bin: string; count: number }[] = getSessionStorageItem(storageKey); // get histogram from session storage

    // check if histogram was saved in sesison storage
    if (histData === null) {
      histData = await getCohortHist(histType, params); // get histrogram from DB
      setSessionStorageItem(storageKey, histData); // save retrieved histogram to session storage
    }

    return histData;
  }

  getCount(cohortDbId: number, filters?: IAllFilters) {
    return getCohortSize({ cohortId: cohortDbId });
  }

  abstract filter(cht: ICohort, filter: INumRange[] | IEqualsList, rangeLabel?: string): Promise<Cohort>;

  abstract toJSON(): IAttributeJSON;
}

export class ServerColumnAttribute extends Attribute {
  resolvedDataType: { dataType: IDataTypeConfig; dataSubType: IDataSubtypeConfig };

  constructor(public readonly id: string, public readonly view: string, public readonly database: string, readonly serverColumn: IServerColumn) {
    super(id, view, database, serverColumn.type);
    this.label = niceName(serverColumn.label);
    this.categories = serverColumn.categories as string[];
  }

  async filter(cht: Cohort, filter: INumRange[] | IEqualsList, rangeLabel?: string): Promise<Cohort> {
    if (Array.isArray(filter)) {
      // TODO label
      // const label = rangeLabel ? rangeLabel : filter.map((a) => labelFromFilter(a, this)).join(' / ');
      const label = rangeLabel || filter.map((a) => easyLabelFromFilter(a, this.label)).join(' / ');
      return createCohortWithNumFilter(cht, niceName(this.id), label, this.id, filter);
    }
    // TODO label
    // const label = rangeLabel ? rangeLabel : labelFromFilter(filter, this);
    const label = rangeLabel || easyLabelFromFilter(filter, this.label);
    return createCohortWithEqualsFilter(cht, niceName(this.id), label, this.id, this.type === 'number' ? 'true' : 'false', filter.values);
  }

  toJSON(): IAttributeJSON {
    const option = {
      optionId: this.id,
      optionType: 'dbc' as OptionType,
      optionText: null,
      optionData: {
        serverColumn: this.serverColumn,
      },
    };
    return {
      option,
      currentDB: this.database,
      currentView: this.view,
    };
  }
}

export class SpecialAttribute extends Attribute {
  constructor(
    public readonly id: string,
    public readonly view: string,
    public readonly database: string,
    public readonly spAttribute: ISpecialAttribute,
    public readonly attrOption: string,
  ) {
    super(id, view, database, spAttribute.type);

    this.spAttribute.attributeOption = this.attrOption;
    this.label = this.spAttribute.label;
    this.dataKey = this.spAttribute.dataKey;
  }

  async getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]> {
    let rows = [];
    if (this.spAttribute.overrideGetData) {
      rows = await this.spAttribute.getData(cohortDbId);
    } // else {
    //   rows = await super.getData(cohortDbId, filters);
    // }

    return rows;
  }

  async getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{ bin: string; count: number }[]> {
    if (this.spAttribute.overrideGetHist) {
      return this.spAttribute.getHist(dbId, filters, bins);
    }
    return null;
  }

  async filter(cht: Cohort, filter: INumRange[] | IEqualsList, rangeLabel?: string): Promise<Cohort> {
    if (this.spAttribute.overrideFilter) {
      // this.spAttribute.attributeOption = this.attrOption;
      // TODO label
      // const label = rangeLabel ? rangeLabel : labelFromFilterArray(filter, this);
      const filterLabel = easyLabelFromFilterArray(filter, this.label);
      const label = rangeLabel || filterLabel;
      return this.spAttribute.filter(cht, filter, label);
    } // else {
    //   rows = await super.filter(cht, filter);
    // }

    return null;
  }

  toJSON(): IAttributeJSON {
    const option = {
      optionId: this.id,
      optionType: 'dbc' as OptionType,
      optionText: null,
      optionData: {
        spAttribute: this.spAttribute,
        attrOprtion: this.attrOption,
      },
    };
    return {
      option,
      currentDB: this.database,
      currentView: this.view,
    };
  }
}

export abstract class AScoreAttribute extends Attribute {
  constructor(public readonly id: string, public readonly view: string, public readonly database: string, public readonly type: AttributeType) {
    super(id, view, database, type);
  }

  async getCount() {
    return -1; // dummy
  }
}

/**
 * Returns the depletion screen (whatever that is) for the given score sub type id
 * @param subTypeID known subtype ids are  ['rsa', 'ataris', 'ceres'] but we are just checking if it is ceres or not.
 */
function getDepletionscreen(subTypeID: string): 'Avana' | 'Drive' {
  return subTypeID === 'ceres' ? 'Avana' : 'Drive'; // copied form tdp_public 🤷‍♂️
}
/**
 * TODO: Compare with  SingleDepletionScore in tdp_publicdb/src/scores/SingleScore.ts
 */
export class GeneScoreAttribute extends AScoreAttribute {
  resolvedDataType: { dataType: IDataTypeConfig; dataSubType: IDataSubtypeConfig };

  constructor(
    public readonly id: string,
    public readonly gene: string,
    public readonly view: string,
    public readonly database: string,
    readonly scoreType: ScoreType,
    readonly scoreSubType: IDataSubtypeConfig,
  ) {
    super(id, view, database, subType2Type(scoreSubType.type));

    this.label = `${gene}: ${scoreSubType.name}`;

    this.preferLog = this.scoreType === 'expression';

    if (scoreSubType.domain) {
      this.min = scoreSubType.domain[0];
      this.max = scoreSubType.domain[1];
    }
    if (scoreSubType.categories) {
      this.categories = scoreSubType.categories.map((cat) => cat.label);
    }

    this.resolvedDataType = resolveDataTypes(scoreType, scoreSubType.id);
    this.dataKey = `${this.id}-${this.resolvedDataType.dataSubType.id}`;
  }

  async getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]> {
    const param = this.getParam();
    const scoreView = this.getView();
    const scoreFilters = this.updateFilters(filters);
    let scores = [];
    if (this.scoreType === 'depletion') {
      const params: ICohortDBDepletionScoreParams = {
        cohortId: cohortDbId,
        table: param.table,
        attribute: param.attribute,
        ensg: param.name,
        depletionscreen: getDepletionscreen(this.scoreSubType.id),
      };
      scores = await getCohortDepletionScore(params);
    } else {
      const params: ICohortDBGeneScoreParams = {
        cohortId: cohortDbId,
        table: param.table,
        attribute: param.attribute,
        ensg: param.name,
      };
      scores = await getCohortGeneScore('tissue', params);
    }

    // rename score property to <id>:
    // BUT:Id is the same for relative copy number, tpm, etc --> we need a suffix
    return scores.map((score) => {
      const enhancedObj = Object.assign(score, { [this.dataKey]: score.score });
      delete enhancedObj.score; // remove score as it was stored at dataKey
      return enhancedObj;
    });
  }

  async filter(cht: Cohort, filter: INumRange[] | IEqualsList, rangeLabel?: string): Promise<Cohort> {
    const param = this.getParam();
    if (Array.isArray(filter)) {
      // TODO label
      // const label = rangeLabel ? rangeLabel : filter.map((a) => labelFromFilter(a, this)).join(' / ');
      const label = rangeLabel || filter.map((a) => easyLabelFromFilter(a, this.label)).join(' / ');
      if (this.scoreType === 'depletion') {
        const depletionscreen = getDepletionscreen(this.scoreSubType.id);
        return createCohortWithDepletionScoreFilter(cht, niceName(this.label), label, param.table, param.attribute, param.name, depletionscreen, filter);
      }
      return createCohortWithGeneNumFilter(cht, niceName(this.label), label, param.table, param.attribute, param.name, filter);
    }
    // TODO label
    // const label = rangeLabel ? rangeLabel : labelFromFilter(filter, this);
    const label = rangeLabel || easyLabelFromFilter(filter, this.label);
    return createCohortWithGeneEqualsFilter(
      cht,
      niceName(this.label),
      label,
      param.table,
      param.attribute,
      param.name,
      this.type === 'number' ? 'true' : 'false',
      filter.values,
    );
  }

  /**
   * little helper to avoid duplicate code
   */
  getParam() {
    return {
      table: this.resolvedDataType.dataType.tableName,
      attribute: this.resolvedDataType.dataSubType.id,
      name: this.id,
      species: 'human',
      target: niceName(this.view),
    };
  }

  /**
   * depletion views are a bit special
   */
  getView() {
    let scoreView = `${this.view}_gene_single_score`;
    if (this.scoreType === 'depletion') {
      scoreView = `depletion_${scoreView}`; // necessary prefix
    }
    return scoreView;
  }

  /**
   * depletion needs an extra filter
   */
  updateFilters(filters: IAllFilters) {
    if (this.scoreType === 'depletion') {
      const depletionscreen = this.scoreSubType.id === 'ceres' ? 'Avana' : 'Drive'; // copied form tdp_public 🤷‍♂️
      if (filters) {
        filters = deepCopy(filters); // don't mess with the cohorts filters
        filters.normal.depletionscreen = depletionscreen;
      } else {
        filters = {
          normal: { depletionscreen },
          lt: {},
          lte: {},
          gt: {},
          gte: {},
        };
      }
    }
    return filters;
  }

  async getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{ bin: string; count: number }[]> {
    const param = this.getParam();

    let params: ICohortDBHistScoreParms = {
      cohortId: dbId,
      attribute: param.attribute,
      table: param.table,
      ensg: param.name,
    };
    let type = this.type === 'number' ? HistRouteType.geneScoreNum : HistRouteType.geneScoreCat;

    // depletion score
    if (this.scoreType === 'depletion') {
      const depletionscreen = this.scoreSubType.id === 'ceres' ? 'Avana' : 'Drive'; // copied form tdp_public
      params.depletionscreen = depletionscreen;
      params = params as ICohortDBHistScoreDepletionParms;

      type = HistRouteType.depletionScore;
    }

    return this.getHistWithStorage(type, params);
  }

  toJSON(): IAttributeJSON {
    const option = {
      optionId: this.id,
      optionType: 'gene' as OptionType,
      optionText: this.gene,
      optionData: {
        type: this.scoreType,
        subType: this.scoreSubType,
      },
    };
    return {
      option,
      currentDB: this.database,
      currentView: this.view,
    };
  }
}

export class PanelScoreAttribute extends AScoreAttribute {
  async getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]> {
    const params: ICohortDBPanelAnnotationParams = {
      cohortId: cohortDbId,
      panel: this.id,
    };
    const scores = await getCohortPanelAnnotation('tissue', params);

    // rename score property to <id>:
    // BUT:Id is the same for relative copy number, tpm, etc --> we need a suffix
    return scores.map((score) => {
      const enhancedObj = Object.assign(score, { [this.dataKey]: score.score });
      delete enhancedObj.score; // remove score as it was stored at dataKey
      return enhancedObj;
    });
  }

  async getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{ bin: string; count: number }[]> {
    const params: ICohortDBHistPanelParms = {
      cohortId: dbId,
      panel: this.id,
    };
    const type = HistRouteType.panelAnnotation;

    return this.getHistWithStorage(type, params);
  }

  async filter(cht: Cohort, filter: INumRange[] | IEqualsList, rangeLabel?: string): Promise<Cohort> {
    if (Array.isArray(filter)) {
      throw new Error('not implemented ☠');
    } else {
      // TODO label
      // const label = rangeLabel ? rangeLabel : labelFromFilter(filter, this);
      const label = rangeLabel || easyLabelFromFilter(filter, this.label);
      const stringValues = (filter.values as any[]).map((item: number | string) => item.toString()); // convert potential numbers to string
      return createCohortWithPanelAnnotationFilter(cht, niceName(this.id), label, this.id, stringValues);
    }
  }

  toJSON(): IAttributeJSON {
    const option = {
      optionId: this.id,
      optionType: 'panel' as OptionType,
      optionText: null,
    };
    return {
      option,
      currentDB: this.database,
      currentView: this.view,
    };
  }
}

export function toAttribute(option: IOption, currentDB, currentView): IAttribute {
  if (option.optionType === 'dbc') {
    if (option.optionData && (option as ISpecialOption).optionData.spAttribute) {
      // Create Special Attribtues
      // if (option.optionData.spA === 'treatment') {
      log.debug('create special Attribute: ', option.optionId);
      log.debug('special Attribute object: ', option.optionData.spAttribute);
      return new SpecialAttribute(
        option.optionId,
        currentView,
        currentDB,
        (option as ISpecialOption).optionData.spAttribute,
        (option as ISpecialOption).optionData.attrOption,
      );
    }
    // Create Attribute
    return new ServerColumnAttribute(option.optionId, currentView, currentDB, (option as IServerColumnOption).optionData.serverColumn);
  }
  // Create ScoreAttribute
  if (option.optionType === 'gene') {
    return new GeneScoreAttribute(
      option.optionId,
      option.optionText,
      currentView,
      currentDB,
      (option as IScoreOption).optionData.type,
      (option as IScoreOption).optionData.subType,
    );
  }
  if (option.optionType === 'panel') {
    return new PanelScoreAttribute(option.optionId, currentView, currentDB, 'categorical');
  }
}

function subType2Type(subType: string): AttributeType {
  // one of number, string, cat, boxplot
  switch (subType) {
    case 'number':
    case 'string':
      return subType;
    case 'cat':
      return 'categorical';
    case 'boxplot':
    default:
      throw new Error(`No Support for type: ${subType}`);
  }
}

export async function multiFilter(baseCohort: Cohort, attributes: IAttribute[], filters: Array<IEqualsList | INumRange[]>): Promise<Cohort> {
  if (attributes.length !== filters.length) {
    throw new Error(`Number of filters has to match the number of attribtues`);
  }

  return multiAttributeFilter(
    baseCohort,
    attributes.map((attr, i) => ({ attr, range: filters[i] })),
  );
}

export async function multiAttributeFilter(baseCohort: Cohort, filters: IAttributeFilter[]): Promise<Cohort> {
  let newCohort = baseCohort;

  const labelOne = [];
  const labelTwo = [];
  const values = [];

  for (const attrFilter of filters) {
    newCohort = await attrFilter.attr.filter(newCohort, attrFilter.range);
    labelOne.push(newCohort.labelOne);
    labelTwo.push(newCohort.labelTwo);
    values.push(...newCohort.values);
  }

  // when only one filter is used the labels don't have to be set again
  // minimizes the number of time a cohort in the DB has to be updated
  if (filters.length > 1) {
    newCohort.setLabels(labelOne.join(', '), labelTwo.join(', '));
    newCohort.values = values;
  }

  return newCohort;
}
