import * as aq from 'arquero';
import { select } from 'd3v7';
import * as LineUpJS from 'lineupjs';
import { Cohort } from '../../Cohort';
import { ICohort } from '../../CohortInterfaces';
import { colors } from '../../config/colors';
import { IAttribute } from '../../data/Attribute';
import { getCohortData } from '../../base/rest';
import { getAnimatedLoadingText } from '../../util';
import { CohortColorSchema } from '../../CohortColorSchema';
import { getIdTypeFromCohort } from '../../utilIdTypes';
import { DATA_LABEL } from '../visualizations';
import { ATask } from './ATask';

export class Details extends ATask {
  public label = `Inspect Items`;

  public id = `details`;

  public hasOutput = false;

  private eventID = 0;

  private _entityName: string = null;

  private $lineUpContainer: HTMLDivElement;

  private lineup: LineUpJS.LineUp;

  supports(attributes: IAttribute[], cohorts: ICohort[]) {
    return cohorts.length > 0;
  }

  showSearchBar() {
    return true;
  }

  async show(columnHeader: HTMLDivElement, container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]) {
    super.show(columnHeader, container, attributes, cohorts);
    const eventId = ++this.eventID; // get new eventID, we will compare it with the field again to see if it is still up to date

    if (cohorts.length > 0) {
      this.$lineUpContainer = this.body.append('div').classed('lineup-container', true).node();
      this.$lineUpContainer.insertAdjacentElement('beforeend', getAnimatedLoadingText('data'));
      select(columnHeader).selectAll('.export').remove();

      const data = await this.getData(attributes, cohorts as Cohort[]);
      if (eventId !== this.eventID) {
        return;
      }
      select(columnHeader)
        .append('button') // add button after the data is available
        .text('Export Data')
        .attr('type', 'button')
        .attr('title', 'Export to CSV')
        .classed('btn btn-coral-prime export', true)
        .style('width', '18rem')
        .style('margin-left', '1rem')
        .style('margin-right', '1rem')
        .on('click', async () => this.download());
      columnHeader.insertAdjacentHTML('beforeend', `<a href="#" id="downloadHelper" class="export" target="_blank" rel="noopener"></a>`);
      this.createLineup(data, attributes, cohorts);
    }
  }

  async getData(attributes: IAttribute[], cohorts: Cohort[]) {
    const idType = getIdTypeFromCohort(cohorts[0] as Cohort);
    this._entityName = idType.entityName;

    const dataPromises = cohorts.map((cht) => {
      const promise = new Promise(async (resolve, reject) => {
        const chtDataPromises = attributes.map((attr) => attr.getData(cht.dbId));
        if (attributes.length === 0) {
          // If Lineup is empty, add entityName as single attribute to be able to show something
          chtDataPromises.push(getCohortData({ cohortId: cht.dbId, attribute: idType.entityName }));
        }
        try {
          const chtData = await Promise.all(chtDataPromises); // array with one entry per attribute, which contains an array with one value for every item in the cohort
          let joinedData = aq.from(chtData[0]);
          for (let i = 1; i < chtData.length; i++) {
            joinedData = joinedData.join_full(aq.from(chtData[i]));
          }
          const labelTable = aq.table({ [DATA_LABEL]: [[`${cht.dbId}`]], [`id_${cht.dbId}`]: ['true'] });
          joinedData = joinedData.join_left(labelTable, (data, label) => true);
          resolve(joinedData.objects());
        } catch (e) {
          reject(e);
        }
      });
      return promise;
    });
    const longData: any[] = (await Promise.all(dataPromises)).flat();
    const map = new Map<string, any>();
    for (const item of longData) {
      let storedItem = map.get(item[this._entityName]);
      if (storedItem) {
        (storedItem[DATA_LABEL] as Array<string>).push(...item[DATA_LABEL]);
        storedItem = Object.assign(item, storedItem);
      } else {
        storedItem = item;
        storedItem[DATA_LABEL] = storedItem[DATA_LABEL].slice(); // clone as all items use the same object
      }
      map.set(item[this._entityName], storedItem);
    }
    const data = Array.from(map.values());
    return data;
  }

  async createLineup(data, attributes, cohorts) {
    const builder = LineUpJS.builder(data);

    // define id column
    builder.column(LineUpJS.buildStringColumn(this._entityName).label('Id').width(120)).column(
      LineUpJS.buildCategoricalColumn(
        DATA_LABEL,
        cohorts.map((cht) => ({ name: `${cht.dbId}`, label: cht.label, color: (cht as Cohort).colorTaskView })),
      )
        .renderer('catheatmap', 'categorical')
        .asSet(),
    );

    // define attribute columns
    for (const attr of attributes) {
      attr.type = attr.dataKey === this._entityName ? 'string' : attr.type;
      if (attr.type === 'categorical') {
        builder.column(LineUpJS.buildCategoricalColumn(attr.dataKey).label(attr.label));
      } else if (attr.type === 'number') {
        builder.column(LineUpJS.buildNumberColumn(attr.dataKey).label(attr.label).colorMapping(colors.barColor));
      } else {
        // text
        builder.column(LineUpJS.buildStringColumn(attr.dataKey).label(attr.label).width(100));
      }
    }

    // builder.sidePanel(true); // sets side panel https://lineup.js.org/master/docs/classes/_builder_databuilder_.databuilder.html#sidepanel
    // builder.summaryHeader(false); // sets the summary header for each column
    // builder.defaultRanking(false); // sets selection,rank, and aggregation columns
    builder.rowHeight(21);
    builder.singleSelection(); // only single selection possible
    this.$lineUpContainer.firstChild.remove();
    this.lineup = builder.build(this.$lineUpContainer);
  }

  getCategoryColorsForColumn(mergedDataArray: any[], attr: IAttribute): { name: string; color: string }[] {
    const uniqueCat = Array.from(new Set(mergedDataArray.map((elem) => elem[attr.dataKey])));
    const categoryColors = uniqueCat.map((cat, i) => {
      return { name: cat, color: CohortColorSchema.get(i) };
    });
    return categoryColors;
  }

  close() {
    super.close();
    select(this.$columnHeader).selectAll('.export').remove();
  }

  async download() {
    const data = await this.lineup.data.exportTable(this.lineup!.data.getRankings()[0], { separator: ';' });
    const b = new Blob([data], { type: 'text/csv' });

    const downloadHelper = this.$columnHeader.querySelector('a#downloadHelper') as HTMLAnchorElement;
    downloadHelper.href = URL.createObjectURL(b);
    downloadHelper.download = 'coral-cohorts.csv';
    downloadHelper.click();
  }
}
