import * as aq from 'arquero';
import * as LineUpJS from 'lineupjs';
import {format} from 'd3-format';
import tippy from 'tippy.js';
import {Cohort, getCohortLabel} from '../../Cohort';
import {ICohort} from '../../CohortInterfaces';
import {IAttribute, ServerColumnAttribute, GeneScoreAttribute} from '../../data/Attribute';
import {Task} from '../../Tasks';
import {getAnimatedLoadingText} from '../../util';
import {DATA_LABEL} from '../visualizations';
import {ATask} from './ATask';
import {colors} from '../../colors';

export class Characterize extends ATask {
  static readonly TREES = 500;
  static readonly jaccardFormat = format('.1~%');

  public label = `Characterize`;
  public id = `characterize`;
  public hasOutput = false;
  private eventID = 0;

  private ids: any[];
  private reader: ReadableStreamDefaultReader<Uint8Array>;

  private progressBar: any;
  private lineup: LineUpJS.Taggle;
  private dataProv: LineUpJS.LocalDataProvider;
  private cohorts: Cohort[];
  private definingAttributes: IAttribute[];


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

    this.cohorts = cohorts as Cohort[];

    if (this.cohorts.length >= 2) {
      this.$container = this.body
        .append('div')
        .classed('characterize-container', true)
        .node();

      this.$container.insertAdjacentElement(
        'beforeend',
        getAnimatedLoadingText('data')
      );

      const attrCohort = (this.cohorts[0]);
      attributes = [
        new ServerColumnAttribute(attrCohort.idColumn.column, attrCohort.view, attrCohort.database, attrCohort.idColumn),
      ];
      this.ids = await this.getData(attributes, this.cohorts);

      if (eventId !== this.eventID) {
        return;
      }

      this.createView();
    }
  }

  private createView() {
    this.$container.innerHTML = `
      <div class="custom-upset-container"></div>
      <div>
        <h1>Cohort Differences</h1>
        <button class="btn btn-coral" id="meta">Compare by <i>Meta-Data</i></button>
        <button class="btn btn-coral" id="mutated">Compare by <i>AA Mutated</i></button>
        <input type="checkbox" id="exclude-attributes" checked> Exclude the cohorts' <span class="hint">defining attributes</span></input>
      </div>

      <div class="progress-wrapper"></div>

      <div class="lineup-container"></div>
    `;

    this.$container.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
      if (this.lineup) {
        this.lineup.destroy();
      }
      this.$container.querySelector('.lineup-container').innerHTML = '';
      this.addProgressBar();
      this.compare(`cmp_${btn.id}`);
    }));

    this.showOverlap(this.$container.querySelector('div.custom-upset-container'));
    this.setDefiningAttributeTooltip(this.$container.querySelector('.hint'));
  }

  private showOverlap(container: HTMLDivElement) {
    container.insertAdjacentHTML('beforeend', `
      <h1 style="display: inline">Item Similarity of Cohorts</h1>
    `);  //in line to display "no overlap" note on the same line
    let localChtCopy = this.cohorts.slice();

    const aqData = this.ids.flat();
    const idsAndTheirCohorts = aq.from(aqData)
    .groupby('tissuename')
    .pivot('Cohort', 'Cohort');
    const uniqueIds = (idsAndTheirCohorts.count().object() as {count: number}).count;
    const intersections = new Map<string, number>();
    let maxJaccard = 0;

    
    while (localChtCopy.length > 1) {
      const drawCht = localChtCopy.shift();
      for (const remainingCht of localChtCopy) {
        const {count} = idsAndTheirCohorts // cmp: https://observablehq.com/d/59236004518c5729
          .filter(aq.escape((d) => d[drawCht.label] !== undefined && d[remainingCht.label] !== undefined))
          .count() // still a aq table
          .object() as {count: number};
        const jaccardIndex = count / uniqueIds;
        intersections.set(`${drawCht.id}-${remainingCht.id}`, jaccardIndex);
        if (jaccardIndex > maxJaccard) {
          maxJaccard = jaccardIndex;
        }
      }
    }

    let noOverlapCounter = 0;
    if (maxJaccard === 0) { // still zero --> no intersection
      container.insertAdjacentHTML('beforeend', `Cohorts do not overlap.`);
    } else {
      localChtCopy = this.cohorts.slice();
      while (localChtCopy.length > 1) {
        const drawCht = localChtCopy.shift();
        for (const remainingCht of localChtCopy) {
          const jaccard = intersections.get(`${drawCht.id}-${remainingCht.id}`);
          if (jaccard > 0) {
            container.insertAdjacentHTML('beforeend', `
              <div>
                <div class="cht-icon" style="background-color: ${drawCht.colorTaskView}"></div>
                <div class="cht-icon" style="background-color: ${remainingCht.colorTaskView}"></div>
                <div class="cht-intersect">
                  <div class="cht-intersect-bar" style="width: ${100 * jaccard}%"></div>
                  <div class="cht-intersect-label">&ensp;${Characterize.jaccardFormat(jaccard)}</div>
                </div>
              </div>
            `);
          } else {
            noOverlapCounter++;
          }
        }
      }

      if (noOverlapCounter > 0) {
        container.insertAdjacentHTML('beforeend', `
        <p class="note" style="margin: 1rem">
          <i class="fa fa-info-circle" style="color: ${colors.barColor}"></i>
          <span>
            ${noOverlapCounter} other cohort combinations have no overlap.
          </span>
        </p>
      `);
      }
    }
  }

  setDefiningAttributeTooltip(hintText: HTMLElement) {
    const attributes = [];
    for (const cht of this.cohorts) {
      const bloodline = cht.getBloodline();
      // get all tasks from the bloodline
      // fist task is the one before the cohort
      let tasks = bloodline.filter((elem) => elem.elemType === 'task').map((elem) => elem.obj) as Task[];
      // reverse order of tasks -> now the first element is the first task after root cohort
      tasks = tasks.reverse();

      tasks.forEach(
        (task) => attributes.push(...task.attributes)
      );
    }

    this.definingAttributes = attributes.filter(
      (attr, i, arr) => arr.findIndex((attr2) => (attr2.id === attr.id)) === i // if there are multiple attributes with the same id, keep the first
    );
    const attributeList = this.definingAttributes
      .map((attr) => attr.label)
      .reduce((text, attr) => text + `<li>${attr}</li>`, '<ol style="margin: 0.25em; padding-right: 1em;">') + '</ol>';

    tippy(hintText, {content: attributeList});
  }

  private async compare(endpoint) {
    const excludeChechbox = this.$container.querySelector('input#exclude-attributes') as HTMLInputElement;
    const excludeBloodline = excludeChechbox.checked;
    const excludeAttributes = !excludeBloodline ? [] : this.definingAttributes
      .filter((attr) => {
        if (endpoint === 'cmp_meta') {
          return 'serverColumn' in attr;
        } else if (endpoint === 'cmp_mutated') {
          return 'gene' in attr;
        }
        return true;
      })
      .map((attr) => 'gene' in attr ? (attr as GeneScoreAttribute).gene : attr.id);

    const response = await this.postData(
      `http://localhost:8444/${endpoint}/`, {
      exclude: excludeAttributes,
      ids: this.ids,
    });

    // start to read response stream
    this.reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let first = true;
    while (true) {
      const {value, done} = await this.reader.read(); //variable names are important for destructuring
      if (done) {
        console.log('the reader is done');
        this.setProgressDone();
        break; // if done, value is undefined --> skip the rest
      }

      const response = decoder.decode(value);
      console.log('response', response);

      try {
        const responseData = JSON.parse(response);
        console.log(responseData.trees);
        this.setProgress(responseData.trees);
        if (first) {
          await this.createLineUp(responseData.importances); // await so its ready for the next response
          first = false;
        } else {
          this.updateLineUp(responseData.importances);
        }
      } catch (e) {
        console.error('could not read JSON data', e);
      }
    }
  }

  async createLineUp(data) {
    const builder = LineUpJS.builder(data);
    this.lineup = builder
      .column(LineUpJS.buildCategoricalColumn('attribute').label('Attribute').width(200))
      .column(LineUpJS.buildStringColumn('category').label('Category').width(200))
      .column(LineUpJS.buildNumberColumn('importance', [0, 1]).label('Importance').width(150))
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
    this.dataProv?.setData(importances);
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

  setProgress(iteration: number, done = false) {
    this.progressBar.textContent = `${iteration}/${Characterize.TREES}`;
    this.progressBar.style.width = `${100 * iteration / Characterize.TREES}%`;

    if (iteration === Characterize.TREES) {
      this.setProgressDone();
    }
  }

  setProgressDone() {
    this.progressBar.textContent = 'Done';
    this.fadeOutProgressBar();
  }

  async fadeOutProgressBar(delay = 2500) {
    return setTimeout(() => {
      const wrapper = this.$container.querySelector('.progress-wrapper');
      wrapper.innerHTML = '';
    }, delay);
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
}
