import _ from 'lodash';
import {IAllFilters} from 'tdp_core';
import {Cohort, createCohortWithTreatmentFilter} from '../Cohort';
import {getRootCohort} from '../cohortview';
import {getCohortData, HistRouteType, ICohortDBHistDataParms, ICohortDBHistPanelParms, ICohortDBHistScoreDepletionParms, ICohortDBHistScoreParms, IEqualsList, INumRange} from '../rest';
import {deepCopy, getSessionStorageItem, log, setSessionStorageItem} from '../util';
import {niceName} from '../utilLabels';
import {AttributeType, IdValuePair} from './Attribute';


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
  options: {id: string, name: string}[];

  /**
   * Option that is should be used to format the data
   */
  attributeOption: string;

  getDetailForSearchBar(): HTMLDivElement;

  getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]>; // IRow has _id but IScoreRow has not

  getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{bin: string, count: number}[]>;

  getHistWithStorage(histType: HistRouteType, params: ICohortDBHistDataParms | ICohortDBHistScoreParms | ICohortDBHistScoreDepletionParms | ICohortDBHistPanelParms): Promise<{bin: string, count: number}[]>;

  getCount(cohortDbId: number, filters?: IAllFilters): Promise<number>;

  filter(cht: Cohort, filter: INumRange[] | IEqualsList, label: string): Promise<Cohort>;

}

export class SATreatment implements ISpecialAttribute {
  readonly overrideSearchBarDetails: boolean = true;
  readonly overrideGetData: boolean = true;
  readonly overrideGetHist: boolean = true;
  readonly overrideGetCount: boolean = true;
  readonly overrideFilter: boolean = true;
  static ID: string = 'treatment';
  type = 'string' as AttributeType;
  readonly id: string;

  options: {id: string; name: string;}[] = [];
  private _attributeOption: string;
  private _dataKey: string;
  private _label: string;

  constructor() {
    this.id = SATreatment.ID;

    this.setupOptions();
  }

  public get attributeOption(): string {
    return this._attributeOption;
  }
  public set attributeOption(value: string) {
    this._attributeOption = value;
    this._dataKey = this.id + ':' + this._attributeOption;
    const name = this.options.filter((opt) => opt.id === this._attributeOption)[0].name;
    this._label = niceName(this.id + ':' + name);
  }

  public get dataKey(): string {
    return this._dataKey;
  }
  // public set dataKey(value: string) {
  //   this._dataKey = value;
  // }

  public get label(): string {
    return this._label;
  }
  // public set label(value: string) {
  //   this._label = value;
  // }

  async setupOptions() {

    const storageKey = `treatment#maxRegimen`;
    let maxRegimen: number = getSessionStorageItem(storageKey); // get histogram from session storage

    // check if histogram was saved in sesison storage
    if (maxRegimen === null || getSessionStorageItem('treatment#categoriesHist') === null || getSessionStorageItem('treatment#categoriesBaseHist') === null) {
      let calcMaxRegimen = 0;
      const rootCohort = getRootCohort();
      const rows = await getCohortData({cohortId: rootCohort.dbId, attribute: this.id});

      // const maxRegimenNumbRows = Math.max(...rows.map((r) => r.treatment).map((t) => t.REGIMEN_NUMBER));
      // const maxRegimenNumb = Math.max(...maxRegimenNumbRows);
      rows.forEach((row) => {
        if (row.treatment) {
          const regimenNumbers = row.treatment.map((t) => t.REGIMEN_NUMBER);
          const currMaxRegimen = Math.max(...regimenNumbers);
          calcMaxRegimen = Math.max(calcMaxRegimen, currMaxRegimen);
        }
      });

      setSessionStorageItem(storageKey, calcMaxRegimen); // save retrieved histogram to session storage
      maxRegimen = calcMaxRegimen;

      // define the histograms
      // regNumb = 0 -> all regimens
      const histCategories: {regNumb: number; categories: string[]}[] = [];
      const histBaseCategories: {regNumb: number; categories: string[]}[] = [];
      for (let i = 0; i <= maxRegimen; i++) {
        const currHist = {regNumb: i, categories: []};
        histCategories.push(currHist);
        histBaseCategories.push(deepCopy(currHist));
      }

      const tempAgents: string[][] = [];
      rows.forEach((row) => {
        if (row.treatment) {
          for (let i = 1; i <= maxRegimen; i++) {
            const currTreatment = row.treatment;
            const currRegimen = currTreatment.filter((tr) => (tr.REGIMEN_NUMBER === i));
            const currAgents: string[] = currRegimen.map((t) => t.AGENT);
            const newBaseValue = currAgents.length === 0 ? ['null'] : deepCopy(currAgents);
            const newValue = currAgents.length === 0 ? 'null' : this.combineAgentsIntoString(currAgents); // combine all agents

            const currHist = histCategories.filter((elem) => (elem.regNumb === i))[0];
            currHist.categories.push(newValue);

            const currHistBase = histBaseCategories.filter((elem) => (elem.regNumb === i))[0];
            currHistBase.categories.push(...newBaseValue);
          }
        }
        // if there is no treatment (=null) for a row than that means ther is also no treatment for regimen number = 1
        // add for both the null categorie
        histCategories.filter((elem) => (elem.regNumb === 0))[0]?.categories.push('null');
        histCategories.filter((elem) => (elem.regNumb === 1))[0]?.categories.push('null');
        histBaseCategories.filter((elem) => (elem.regNumb === 0))[0]?.categories.push('null');
        histBaseCategories.filter((elem) => (elem.regNumb === 1))[0]?.categories.push('null');
      });

      // get all regimen hists
      const histAllReg = histCategories.filter((elem) => (elem.regNumb === 0))[0];
      const histBaseAllReg = histBaseCategories.filter((elem) => (elem.regNumb === 0))[0];

      // remove duplicate categories and define all regimen categories
      for (let i = 1; i <= maxRegimen; i++) {
        const currHist = histCategories.filter((elem) => (elem.regNumb === i))[0];
        currHist.categories = [...new Set(currHist.categories)].sort();
        histAllReg.categories.push(...currHist.categories);

        const currBaseHist = histBaseCategories.filter((elem) => (elem.regNumb === i))[0];
        currBaseHist.categories = [...new Set(currBaseHist.categories)].sort();
        histBaseAllReg.categories.push(...currBaseHist.categories);
      }
      // remove duplicates for the all regimens hists
      histAllReg.categories = [...new Set(histAllReg.categories)].sort();
      histBaseAllReg.categories = [...new Set(histBaseAllReg.categories)].sort();

      setSessionStorageItem('treatment#categoriesHist', histCategories); // save retrieved histogram to session storage
      setSessionStorageItem('treatment#categoriesBaseHist', histBaseCategories); // save retrieved histogram to session storage

    }

    const opts: {id: string; name: string;}[] = [];

    // agent combination for all regimen
    opts.push({id: 'treatment:all_agents', name: 'All Regimens'});
    // agent combination per regimen
    for (let i = 1; i <= maxRegimen; i++) {
      const currOpt = {id: `treatment:rg_${i}`, name: `Regimen ${i}`};
      opts.push(currOpt);
    }

    // agent combination for all regimen
    opts.push({id: 'treatment:base:all_agents', name: 'All Regimens (Base)'});
    // base combination per regimen
    for (let i = 1; i <= maxRegimen; i++) {
      const currOpt = {id: `treatment:base:rg_${i}`, name: `Regimen ${i} (Base)`};
      opts.push(currOpt);
    }

    // log.debug('Treatment Options: ', opts);
    this.options = opts;

  }

  combineAgentsIntoString(agents: string[]): string {
    return agents.sort().join(', ');
  }

  getDetailForSearchBar(): HTMLDivElement {
    throw new Error('Method not implemented.');
  }

  async getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]> {
    let rows = await getCohortData({cohortId: cohortDbId, attribute: this.id});

    // log.debug('first row: ', JSON.stringify(rows[0]));
    const propTn = 'tissuename';

    if (this.attributeOption === 'treatment:all_agents' || this.attributeOption === 'treatment:base:all_agents') {
      const newRows = [];
      rows.forEach((row) => {
        if (row.treatment) {
          const currTreatment = row.treatment;
          const maxRegimen = Math.max(...currTreatment.map((t) => t.REGIMEN_NUMBER));
          const agents = new Set();
          for (let i = 1; i <= maxRegimen; i++) {
            const currRegimen = currTreatment.filter((tr) => (tr.REGIMEN_NUMBER === i));
            const currAgents: string[] = currRegimen.map((t) => t.AGENT);
            if (this.attributeOption === 'treatment:base:all_agents') {
              currAgents.reduce((set, agent) => set.add(agent), agents);
            } else { // = treatment:all_agents
              const newValue = currAgents.length === 0 ? null : this.combineAgentsIntoString(currAgents); // combine all agents
              agents.add(newValue); // add to set to remove possible duplicates
            }
          }
          newRows.push(...Array.from(agents).map((agent) => ({[propTn]: row[propTn], treatment: agent})));
        } else {
          newRows.push({[propTn]: row[propTn], treatment: null}); // no treatment for item
        }
      });
      rows = newRows;
      // log.debug('Agents for all regimens: ', rows);
    } else if (this.attributeOption.includes('treatment:rg_')) {
      const rgNumb = Number(this.attributeOption.slice(-1));
      rows.forEach((row) => {
        if (row.treatment) {
          const currTreatment = row.treatment;
          const currRegimen = currTreatment.filter((tr) => (tr.REGIMEN_NUMBER === rgNumb));
          const currAgents: string[] = currRegimen.map((t) => t.AGENT);
          const newValue = currAgents.length === 0 ? null : this.combineAgentsIntoString(currAgents);
          row.treatment = newValue;
        }
      });
      // log.debug('Agents per regimen: ', rgNumb, rows);
    } else if (this.attributeOption.includes('treatment:base:rg_')) {
      const newRows = [];
      const rgNumb = Number(this.attributeOption.slice(-1));
      rows.forEach((row) => {
        if (row.treatment) {
          const currTreatment = row.treatment;
          const currRegimen = currTreatment.filter((tr) => (tr.REGIMEN_NUMBER === rgNumb));
          let currAgents: {treatment: string}[] = currRegimen.map((t) => {return {[propTn]: row[propTn], treatment: t.AGENT};});
          currAgents = currAgents.length === 0 ? [{treatment: null}] : currAgents;
          newRows.push(...currAgents);
        } else {
          newRows.push({[propTn]: row[propTn], treatment: null});
        }

      });
      rows = newRows;
      // log.debug('Base Agents per regimen: ', rgNumb, rows);
    } else {
      log.warn('This attribute option is not yet implemented');
      rows = [];
    }


    // rename treatment (=id) property to <_dataKey>: has to be done to differentiate between the options
    // otherwise having the same attribute with different options would not work
    rows.map((row) => {
      const treatmentObj = Object.assign(row, {[this._dataKey]: row.treatment});
      delete treatmentObj.treatment; // remove score as it was stored at dataKey
      return treatmentObj;
    });
    // log.debug('first row: ', JSON.stringify(rows.slice(0, 4)));
    return rows;
  }
  async getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{bin: string; count: number;}[]> {

    // define storagekey as cohort dbId and attribute label
    const storageKey = `${dbId}#${this.id}#${this.attributeOption}`;
    let histData: {bin: string, count: number}[] = getSessionStorageItem(storageKey); // get histogram from session storage

    // check if histogram was saved in sesison storage
    if (histData === null) {

      const rows = await this.getData(dbId);

      const valTreatement = rows.map((elem) => elem[this._dataKey]);
      const lodashCountBy = _.countBy(valTreatement);
      // log.debug('lodash frequency plot: ', lodashCountBy);

      let currHistCategories = [];
      if (this.attributeOption.includes('treatment:base')) {
        // base agents plot
        const categoriesBaseHist: {regNumb: number; categories: string[]}[] = getSessionStorageItem('treatment#categoriesBaseHist');
        if (this.attributeOption.includes('all_agents')) {
          // all agents
          currHistCategories = categoriesBaseHist.filter((elem) => elem.regNumb === 0)[0].categories;
        } else {
          // regimen number
          const rgNumb = Number(this.attributeOption.split('rg_')[1]);
          // log.debug('base reg number: ', rgNumb);
          currHistCategories = categoriesBaseHist.filter((elem) => elem.regNumb === rgNumb)[0].categories;
        }
      } else {
        // agents (combination) plot
        const categoriesHist: {regNumb: number; categories: string[]}[] = getSessionStorageItem('treatment#categoriesHist');
        if (this.attributeOption.includes('all_agents')) {
          // all agents
          currHistCategories = categoriesHist.filter((elem) => elem.regNumb === 0)[0].categories;
        } else {
          // regimen number
          const rgNumb = Number(this.attributeOption.split('rg_')[1]);
          // log.debug('base reg number: ', rgNumb);
          currHistCategories = categoriesHist.filter((elem) => elem.regNumb === rgNumb)[0].categories;
        }
      }

      // log.debug('all categories of dataset: ', currHistCategories);
      histData = currHistCategories.map((cat) => {return {bin: cat, count: 0};});
      histData.forEach((elem) => {
        const name = elem.bin;
        const count = lodashCountBy[name];
        elem.count = count === undefined || null ? 0 : count;
      });
      // log.debug('finished hist: ', histData);
      setSessionStorageItem(storageKey, histData); // save retrieved histogram to session storage
    }

    return await histData;
  }

  getHistWithStorage(histType: HistRouteType, params: ICohortDBHistDataParms | ICohortDBHistScoreParms | ICohortDBHistScoreDepletionParms | ICohortDBHistPanelParms): Promise<{bin: string; count: number;}[]> {
    throw new Error('Method not implemented.');
  }

  getCount(cohortDbId: number, filters?: IAllFilters): Promise<number> {
    throw new Error('Method not implemented.');
  }
  filter(cht: Cohort, filter: INumRange[] | IEqualsList, label: string): Promise<Cohort> {
    log.debug('FILTER of special attribute: ', {cht, filter});
    const optName = this.options.filter((o) => o.id === this.attributeOption)[0].name;
    const baseAgent = this.attributeOption.includes('base');

    if (!Array.isArray(filter)) {
      const agent = filter.values as string[];

      if (this.attributeOption.includes('all_agents')) {
        // with all regimens
        return createCohortWithTreatmentFilter(cht, niceName(`${this.id}:${optName}`), label, baseAgent, agent, null);
      } else if (this.attributeOption.includes(':rg_')) {
        // only for one regimen
        const rgNumb = Number(this.attributeOption.slice(-1));
        return createCohortWithTreatmentFilter(cht, niceName(`${this.id}:${optName}`), label, baseAgent, agent, rgNumb);
      }

    }
  }

}


const specAttributes: {id: string; getClass: Function}[] = [{id: SATreatment.ID, getClass: (): ISpecialAttribute => {return new SATreatment();}}];

export function checkSpecialAttribute(attributeId: string): ISpecialAttribute {
  let specialAttribute = null;
  for (const attr of specAttributes) {
    if (attributeId === attr.id) {
      specialAttribute = attr.getClass();
    }
  }
  return specialAttribute;
}
