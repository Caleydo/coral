import * as aq from 'arquero';
import {table} from 'console';
import { Cohort, getCohortLabel } from '../../Cohort';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute, ServerColumnAttribute } from '../../data/Attribute';
import { getCohortData } from '../../rest';
import { CohortColorSchema, getAnimatedLoadingText } from '../../util';
import { getIdTypeFromCohort } from '../../utilIdTypes';
import { DATA_LABEL } from '../visualizations';
import { ATask } from './ATask';

export class Compadre extends ATask {
  public label = `Compare ++`;
  public id = `compadre`;
  public hasOutput = false;
  private eventID = 0;
  private _entityName: string = null;
  private ids: any[];

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
        .classed('compadre-container', true)
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
    <div>
      <p>Differences in:</p>

      <input type="radio" name="cmp_data" value="Meta Information" checked>
      <label>Meta Information</label>

      <input disabled type="radio" name="cmp_data" value="Mutated State">
      <label">Mutated State</label>

      <input disabled type="radio" name="cmp_data" value="Mutaion Type">
      <label">Mutation Type</label>

      <p><button>Compare</button></p>

      <div class="output"></div>
    </div>
    `;

    this.$container.querySelector('button').addEventListener('click', () => {
      this.$container
        .querySelector('.output')
        .insertAdjacentElement('beforeend', getAnimatedLoadingText('data'));
      this.sendData(this.ids);
    });
  }

  async sendData(ids) {
    const response = await this.postData(
      'http://localhost:8444/cmp_meta/', {
      exclude: ['tissuename', 'tdpid'],
      ids,
    });
    console.log('Request complete! response:', JSON.stringify(response));
    this.visualize(response);
  }

  visualize(response) {
    this.$container.querySelector('.output').innerHTML =
      'Response is here ' + JSON.stringify(response);
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
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }
}
