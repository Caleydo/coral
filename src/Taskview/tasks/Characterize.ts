
import * as aq from 'arquero';
import * as LineUpJS from 'lineupjs';
import {extractCombinations, extractSets, generateCombinations, isGenerateSetCombinationOptions, renderUpSet} from '@upsetjs/bundle';
import {Cohort, getCohortLabel} from '../../Cohort';
import {ICohort} from '../../CohortInterfaces';
import {IAttribute, ServerColumnAttribute} from '../../data/Attribute';
import {getAnimatedLoadingText} from '../../util';
import {DATA_LABEL} from '../visualizations';
import {ATask} from './ATask';
import {colors} from '../../colors';

export class Characterize extends ATask {
  static readonly TREES = 500;

  public label = `Characterize`;
  public id = `characterize`;
  public hasOutput = false;
  private eventID = 0;
  private ids: any[];
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  progressBar: any;
  lineup: LineUpJS.Taggle;
  dataProv: LineUpJS.LocalDataProvider;

  supports(attributes: IAttribute[], cohorts: ICohort[]) {
    return cohorts.length >= 2;
  }

  showSearchBar() {
    return false;
  }

  async show(
    columnHeader: HTMLDivElement,
    container: HTMLDivElement,
    attributes: IAttribute[],
    cohorts: ICohort[]
  ) {
    super.show(columnHeader, container, attributes, cohorts);
    const eventId = ++this.eventID; // get new eventID, we will compare it with the field again to see if it is still up to date

    if (cohorts.length >= 2) {
      this.$container = this.body
        .append('div')
        .classed('characterize-container', true)
        .node();

      this.$container.insertAdjacentElement(
        'beforeend',
        getAnimatedLoadingText('data')
      );

      const attrCohort = (cohorts[0] as Cohort);
      attributes = [
        new ServerColumnAttribute(attrCohort.idColumn.column, attrCohort.view, attrCohort.database, attrCohort.idColumn),
      ];
      this.ids = await this.getData(attributes, cohorts as Cohort[]);

      if (eventId !== this.eventID) {
        return;
      }

      this.appendTable();
    }
  }

  appendTable() {
    this.$container.innerHTML = `
      <div class="upset-container">
      <div>
        <button class="btn btn-coral" id="meta">Compare by <i>Meta-Data</i></button>
        <button class="btn btn-coral" id="mutated">Compare by <i>AA Mutated</i></button>
      </div>

      <div class="progress-wrapper"></div>

      <div class="lineup-container"></div>
    `;

    this.$container.querySelector('button#meta').addEventListener('click', () => {
      if (this.lineup) {
        this.lineup.destroy();
      }
      this.$container.querySelector('.lineup-container').innerHTML = '';
      this.addProgressBar();
      this.sendData(`cmp_meta`, this.ids);
    });

    this.appendUpset(this.$container.querySelector('div.upset-container'));
  }


  appendUpset(container: HTMLDivElement) {
    const elems = this.getSetData(this.ids);
    const {sets, combinations} = extractCombinations(elems, ({name, sets}) => sets, {type: 'intersection'});
    const sets2 = extractSets(elems, ({name, sets}) => sets, {});
    const combinations2 = generateCombinations(sets2, {type: 'intersection', min: 2, empty: true, max: 2});

    let selection = null;

    function onHover(set) {
      selection = set;
      rerender();
    }

    function rerender() {
      renderUpSet(container, {
        sets: sets2, combinations: combinations2,
        width: 800, height: 200,
        // title: 'Cohort Overlap',
        // description: 'Intersection of selected cohorts',
        // selection, onHover,
        exportButtons: false,
        setLabelAlignment: 'right',
        // setName: 'Size',
        color: colors.barColor
      });
    }

    rerender();
    // remove set size barchar
    container.querySelectorAll('g[data-upset="setaxis"]').forEach((d) => d.remove());
    container.querySelectorAll('text[class^="sBarTextStyle-upset"]').forEach((d) => d.remove());
    container.querySelectorAll('g[data-upset="sets"] rect[class^="fillPrimary-upset"]').forEach((d) => d.remove());
    // remove clipping of cohort labels
    container.querySelectorAll('text[class^="setTextStyle-upset"]').forEach((d) => d.removeAttribute('clip-path'));
  }

  getSetData(ids: any[]) {
    const setMap = new Map<string, string[]>();
    const idList = ids.flat();
    idList.forEach((d) => {
      if (!setMap.has(d.tissuename)) {
        setMap.set(d.tissuename, [d.Cohort]);
      } else {
        setMap.get(d.tissuename).push(d.Cohort);
      }
    });

    const setArr = Array
      .from(setMap)
      .map(([key, value]) => ({name: key, sets: value}));
    return setArr;
  }

  async sendData(endpoint, ids) {
    const response = await this.postData(
      `http://localhost:8444/${endpoint}/`, {
      exclude: ['tissuename', 'tdpid'],
      ids,
    });
    this.visualize(response);
  }

  async visualize(response) {
    this.reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let first = true;
    while (true) {
      const {value, done} = await this.reader.read(); //variable names are important for destructuring
      if (done) {console.log('done'); break;} // if done, value is undefined

      const response = decoder.decode(value);
      console.log('response', response);

      try {
        const responseData = JSON.parse(response);
        if (first) {
          await this.createLineUp(responseData.importances); // await so its ready for the next response
          first = false;
        }
        this.setProgress(responseData.trees);
        this.updateLineUp(responseData.importances);

      } catch (e) {
        console.error('could not read JSON data', e);
      }
    }
  }

  async getData(attributes: IAttribute[], cohorts: Cohort[]) {
    const dataPromises = cohorts
      .map((cht, chtIndex) => {
        const promise = new Promise(async (resolve, reject) => {
          const chtDataPromises = attributes.map((attr) => attr.getData(cht.dbId));
          try {
            const chtData = await Promise.all(chtDataPromises); // array with one entry per attribute, which contains an array with one value for every item in the cohort
            let joinedData = aq.from(chtData[0]);
            for (let i = 1; i < chtData.length; i++) {
              joinedData = joinedData.join_full(aq.from(chtData[i]));
            }
            const labelTable = aq.table({[DATA_LABEL]: [getCohortLabel(cht)]});
            joinedData = joinedData.join_left(labelTable, (data, label) => true);
            resolve(joinedData.objects());
          } catch (e) {
            reject(e);
          }
        });
        return promise;
      });
    const data = await Promise.all(dataPromises);
    return data;
  }

  // Example POST method implementation:
  async postData(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
      //TODO abortController
    });
    return response;
  }

  addProgressBar() {
    const wrapper = this.$container.querySelector('.progress-wrapper');
    wrapper.innerHTML = '';
    wrapper.insertAdjacentHTML('beforeend', `
      <div class="progress-ctrl">
        <a class="run" role="button"><i class="fas fa-fw fa-stop-circle"></i></a>
      </div>
      <div  class="progress">
        <div class="progress-bar" role="progressbar">
          0/${Characterize.TREES}
        </div>
      </div>
    `);
    this.progressBar = wrapper.querySelector('.progress .progress-bar');
    wrapper
      .querySelector(('a.run'))
      .addEventListener('click', () => {
        this.reader?.cancel();
        wrapper.querySelector('.progress-ctrl').remove();
        this.progressBar.textContent = 'Stopped';
        this.fadeOutProgressBar();
      });
  }

  setProgress(iteration: number) {
    this.progressBar.textContent = `${iteration}/${Characterize.TREES}`;
    this.progressBar.style.width = `${100 * iteration / Characterize.TREES}%`;

    if (iteration === Characterize.TREES) {
      this.progressBar.textContent = 'Done';
      this.fadeOutProgressBar();
    }
  }

  async fadeOutProgressBar(delay = 2500) {
    return setTimeout(() => {
      const wrapper = this.$container.querySelector('.progress-wrapper');
      wrapper.innerHTML = '';
    }, delay);
  }


  async createLineUp(data) {
    const builder = LineUpJS.builder(data);
    this.lineup = builder
      .column(LineUpJS.buildCategoricalColumn('attribute').label('Attribute').width(200))
      .column(LineUpJS.buildStringColumn('category').label('Category').width(200))
      .column(LineUpJS.buildNumberColumn('importance').label('Importance').width(150))
      .deriveColors()
      .ranking(LineUpJS.buildRanking()
        .supportTypes()
        .allColumns()
        .sortBy('Importance', 'desc')
        // .groupBy('Attribute')
        .groupSortBy('Importance', 'desc')
      )
      .buildTaggle(this.$container.querySelector('.lineup-container'));

    this.dataProv = this.lineup.data as LineUpJS.LocalDataProvider;

    const children = this.lineup.data.getFirstRanking().children; // alternative: builder.buildData().getFirstRanking(),...
    (children[children.length - 1] as LineUpJS.NumberColumn).setFilter({
      filterMissing: true,
      min: 0.001,
      max: Infinity
    });
  }

  updateLineUp(importances: any) {
    this.dataProv.setData(importances);
  }
}
