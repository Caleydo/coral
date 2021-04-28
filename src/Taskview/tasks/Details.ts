import * as LineUpJS from 'lineupjs';
import _ from 'lodash';
import * as loMerge from 'lodash.merge';
import * as loPick from 'lodash.pick';
import {Cohort} from '../../Cohort';
import {ICohort} from '../../CohortInterfaces';
import {colors} from '../../colors';
import {IAttribute} from '../../data/Attribute';
import {getCohortData} from '../../rest';
import {CohortColorSchema, deepCopy, getAnimatedLoadingText} from '../../util';
import {getIdTypeFromCohort, IEntitySourceConfig} from '../../utilIdTypes';
import {ATask} from './ATask';

export class Details extends ATask {
  public label = `Inspect Items`;
  public id = `details`;
  public hasOutput = false;
  private _builder: LineUpJS.DataBuilder = null;
  private _idType: IEntitySourceConfig = null;
  private _entityName: string = null;
  private $lineUpContainer: HTMLDivElement;
  private _idColRoot: any[] = [];
  private _rootChtId: number;
  private _currData: any[] = [];
  private _oldAttrsId: string[] = [];
  private _oldChtsdbId: number[] = [];

  supports(attributes: IAttribute[], cohorts: ICohort[]) {
    return cohorts.length > 0;
  }

  showSearchBar() {
    return true;
  }

  show(container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]) {
    super.show(container, attributes, cohorts);

    if (cohorts.length > 0) {
      if (!this._rootChtId) {
        const bloodline = (cohorts[0] as Cohort).getBloodline();
        this._rootChtId = (bloodline[bloodline.length - 1].obj as Cohort).dbId;
        // log.debug('deatils root cht: ',this._rootChtId);
      }
      this.$lineUpContainer = this.body.append('div').classed('lineup-container', true).node();
      this.$lineUpContainer.insertAdjacentElement('beforeend', getAnimatedLoadingText('data'));

      this._idType = getIdTypeFromCohort(cohorts[0] as Cohort);
      this._entityName = this._idType.entityName;

      this.addAttribute(attributes, cohorts);
      // https://lineup.js.org/master/docs/classes/_builder_databuilder_.databuilder.html#column
      // this._builder = LineUpJS.builder([]);
      // https://lineup.js.org/master/docs/classes/_provider_localdataprovider_.localdataprovider.html
      // const dataProvider = this._builder.buildData();
    }

  }

  async addAttribute(attributes: IAttribute[], cohorts: ICohort[]) {

    if (this._idColRoot.length === 0) {
      this._idColRoot = await getCohortData({cohortId: this._rootChtId, attribute: this._idType.entityName});
      this._currData = deepCopy(this._idColRoot);
    }

    // get new attributes columns
    const addAttributes = attributes.filter((attr) => {
      return this._oldAttrsId.indexOf(attr.dataKey) === -1;
    });
    // log.debug('addAttributes: ', addAttributes);
    this._oldAttrsId = attributes.map((attr) => attr.dataKey);
    const attrColumnsLU = attributes.map((attr) => attr.dataKey);

    // get new cohort affiliation columns
    const addCohorts = cohorts.filter((cht) => {
      return this._oldChtsdbId.indexOf(cht.dbId) === -1;
    });
    // log.debug('addCohorts: ', addCohorts);
    this._oldChtsdbId = cohorts.map((cht) => cht.dbId);
    const chtColumnsLU = cohorts.map((cht) => 'id_' + cht.dbId);

    const addChtAssign = {};
    for (const cht of addCohorts) {
      addChtAssign['id_' + cht.dbId] = 'false'; // creates for each cohort a property with the label name and value = flase
    }
    // log.debug('addChtAssign: ', addChtAssign);

    // --- add/remove columns to/from data
    // add attributes to data
    for (const attr of addAttributes) {
      let attrData = await attr.getData(this._rootChtId);
      if (attr.id === 'treatment') {
        const treatmentsPerTissue = _.groupBy(attrData, 'tissuename');
        // log.debug('groupBy from Lodash:, ', treatmentsPerTissue);
        const props = _.keys(treatmentsPerTissue);
        const newData = props.map((prop) => {
          const val = treatmentsPerTissue[prop];
          const valArr = val.map((elem) => elem[attr.dataKey]);
          const valCombine = valArr.join('/');
          return {'tissuename': prop, [attr.dataKey]: valCombine};
        });
        // log.debug('newData: ', newData);
        attrData = newData as any;
      }
      this._currData = loMerge(this._currData, attrData);
    }
    // add cohort affiliation columns
    this._currData = this._currData.map((row) => {
      const newRowObj = Object.assign(row, addChtAssign);
      return newRowObj;
    });

    // add cohort affiliation
    for (const cht of addCohorts) {
      // get entity column from db for cohort
      const entityCol = await getCohortData({cohortId: cht.dbId, attribute: this._idType.entityName});
      // create array of the entities
      const entityNames = entityCol.map((elem) => elem[this._entityName]);
      // only get the entities that are in the current cohort
      let currChtData = this._currData.filter((row) => entityNames.indexOf(row[this._entityName]) !== -1);
      // set value for the cohort affiliation column to 'true'
      currChtData = currChtData.map((row) => row['id_' + cht.dbId] = 'true');
    }

    // show only columns that are selcted + cohort affiliation
    const allCol = [this._entityName, ...attrColumnsLU, ...chtColumnsLU];
    // log.debug('all columns in lineup: ',allCol);
    // only pick current attributes and cohort affiliation columns per row
    this._currData = this._currData.map((row) => loPick(row, allCol));

    // filter only for entities that are in one of the cohorts
    const visibleData = this._currData.filter((row) => {
      // get all cht affiliations columns of entity
      const chtAffCols = Object.values(loPick(row, chtColumnsLU));
      // check if one of the values is 'true'
      const minOne: boolean = chtAffCols.some((elem) => elem === 'true');
      return minOne;
    });


    // log.debug('currData: ',this._currData);
    // log.debug('visibleData: ',visibleData);

    // *****************************
    // LineUp configurations
    // *****************************
    // define DataBuilder
    this._builder = LineUpJS.builder(visibleData);

    // --- add columns definition for LineUp
    // define id column
    this._builder.column(LineUpJS.buildStringColumn(this._entityName).label('Id').width(150));

    // define attribute columns
    for (const attr of attributes) {
      attr.type = attr.dataKey === this._entityName ? 'string' : attr.type;
      if (attr.type === 'categorical') {
        this._builder
          .column(LineUpJS.buildCategoricalColumn(attr.dataKey).categories(this.getCategoryColorsForColumn(this._currData, attr)).label(attr.label));
      } else if (attr.type === 'number') {
        this._builder.column(LineUpJS.buildNumberColumn(attr.dataKey).label(attr.label).colorMapping(colors.barColor));
      } else { // text
        this._builder.column(LineUpJS.buildStringColumn(attr.dataKey).label(attr.label).width(100));
      }
    }

    // define cohort affiliation columns
    for (const cht of cohorts) {
      this._builder.column(LineUpJS.buildCategoricalColumn('id_' + cht.dbId, ['true', 'false']).categories([{name: 'true', color: (cht as Cohort).colorTaskView}, {name: 'false', color: colors.barColor}]).label(`In: ` + cht.label));
    }

    // Maybe needed for later when only one column is used for the cohort affiliation
    // const catsColDesc: ICategoricalsColumnDesc & IArrayColumnDesc<string | null> = {
    //   type: 'categoricals',
    //   dataLength: cohorts.length,
    //   label: 'catsCol',
    //   categories,
    //   missingCategory: 'm.V.'
    // };
    // const setColDesc: ISetDesc & IValueColumnDesc<string[]> = {
    //   type: 'set',
    //   label: 'setCol',
    //   // categories: cohorts.map((elem,i) => {return {name: elem.label, label: elem.label, color: Cat16.get(i)};}),
    //   categories: cohorts.map((elem,i) => elem.label),
    //   missingCategory: 'm.V.',
    // };

    // // categoircalsColumn
    // // this._builder.column(colDesc);
    // // setColumn
    // // this._builder.column(setColDesc);

    // log.debug('setColumnDesc: ',setColDesc);
    // const setColumn = new SetColumn('setCol',setColDesc);
    // // this._builder.column(new LineUpJS.SetColumn('setCol', setColDesc).desc);
    // log.debug('set Column desc: ',setColumn.desc);
    // // this._builder.column(setColumn.desc);
    // this._builder.column(LineUpJS.SetColumn.   .buildColumn('set','setCol').label('Cohorts'));
    // // this._builder.column({ type: 'set', label: 'cohorts', column: 's', categories: ['c1', 'c2', 'c3']});
    // // this._builder.deriveColumns('setCol');

    // // log.debug('catsColumnDesc: ',catsColDesc);
    // // const catColumn = new CategoricalsColumn('catsCol', catsColDesc);
    // // // this._builder.column(new LineUpJS.CategoricalsColumn('catsCol', catsColDesc).desc);
    // // this._builder.deriveColumns('catsCol').column(catColumn.desc);
    // // // this._builder.deriveColumns('catsCol');

    // https://lineup.js.org/master/docs/modules/_builder_column_numbercolumnbuilder_.html
    // https://lineup.js.org/master/docs/classes/_builder_column_categoricalcolumnbuilder_.categoricalcolumnbuilder.html#color

    this._builder.sidePanel(true); // sets side panel https://lineup.js.org/master/docs/classes/_builder_databuilder_.databuilder.html#sidepanel
    // this._builder.summaryHeader(false); // sets the summary header for each column
    // this._builder.defaultRanking(false); // sets selection,rank, and aggregation columns
    this._builder.rowHeight(20, 2); // set row height = 20 and padding = 2
    this._builder.singleSelection(); // only single selection possible
    this.$lineUpContainer.firstChild.remove();
    const lineup = this._builder.build(this.$lineUpContainer);
  }






  getCategoryColorsForColumn(mergedDataArray: any[], attr: IAttribute): {name: string, color: string}[] {
    const uniqueCat = Array.from(new Set(mergedDataArray.map((elem) => elem[attr.dataKey])));
    const categoryColors = uniqueCat.map((cat, i) => {return {name: cat, color: CohortColorSchema.get(i)};});
    // log.debug('unique categories for "',attr.dataKey,'" : ', categoryColors);
    return categoryColors;
  }

  // source: dataset of the first cohort
  // target: dataset of the second cohort
  // propConflicts: names of the properties where a conflict can occur -> in our case the cohort affiliation
  mergeCohortData(source: any[], target: any[], propConflicts: string[]): any[] {
    const entityName = this._idType.entityName;
    let mergedData = source;
    if (source.length === 0) {
      mergedData = target;
    } else {
      for (const elemT of target) {
        const targetEntity = elemT[entityName];
        if (mergedData.map((mergedDataElem) => mergedDataElem[entityName]).indexOf(targetEntity) === -1) {
          mergedData.push(elemT);
        } else {
          const currElem = mergedData.filter((mergedDataElem) => mergedDataElem[entityName] === targetEntity)[0];
          // resolve conflicting properties -> cohort affiliation
          for (const cProp of propConflicts) {
            // const currElem = mergedData.filter((elem) => elem[key] === currKeyValue)[0];
            // currElem[cProp] = currElem[cProp] || elemT[cProp];
            currElem[cProp] = currElem[cProp] === elemT[cProp] ? currElem[cProp] : 'true';
          }
          // setColumn
          const setCol = 'setCol';
          const mergedSetCol = currElem[setCol] as string[];
          currElem[setCol] = mergedSetCol.concat(elemT[setCol]);
          // categoricalColumn
          const catsCol = 'catsCol';
          const mergedCatsCol = currElem[catsCol] as string[];
          // currElem['catsCol'] = mergedCatsCol.concat(elemT['catsCol']);
          currElem[catsCol].push(...elemT[catsCol]);
        }
      }
    }

    return mergedData;
  }

}
