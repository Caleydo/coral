import log from 'loglevel';
import { TopLevelSpec as VegaLiteSpec } from 'vega-lite';
import { getCohortLabels } from '../../Cohort';
import { ICohort } from '../../app/interfaces';
import { DATA_LABEL } from './constants';
import { MultiAttributeVisualization } from './MultiAttributeVisualization';
import { IdValuePair } from '../../data/IAttribute';
import {select} from "d3v7";
import {createDBCohortAutomatically, ICohortMultiAttrDBDataParams} from "../../base";
import {INewCohortDesc} from "../../util";
import {AutoSplitEvent} from "../../base/events";

export class AreaChart extends MultiAttributeVisualization {
  static readonly NAME = 'Area Chart';

  constructor(vegaLiteOptions: object = {}) {
    super(vegaLiteOptions);
  }

  async createAutomatically(useNumberOfClusters: boolean = false) {
    console.log("createAutomatically scatterplot");

    // AttributeType = 'categorical' | 'number' | 'string'; TODO send it with the data

    let numberOfClusters = 0;
    if (useNumberOfClusters) {
      // select the bins field
      // binsCount = (this.controls.querySelector('#split input.bins') as HTMLInputElement).valueAsNumber;
      numberOfClusters = (this.controls.querySelector(`#autoSplitControls input.clusters`) as HTMLInputElement).valueAsNumber;
      console.log("numberOfClusters", numberOfClusters);
    }

    let newCohortIds = [];
    let attributesMapped = this.attributes.map((attr) => {return {dataKey: attr.dataKey, type: attr.type}});
    // convert the attributesParam to a JSON object
    let attributesParam: string = JSON.stringify(attributesMapped);
    for (const cht of this.cohorts) {
      // const params: ICohortMultiAttrDBDataParams = {
      //   cohortId: cht.dbId,
      //   attribute0: this.attributes[0].dataKey,
      //   attribute0type: this.attributes[0].type,
      //   attribute1: this.attributes[1].dataKey,
      //   attribute1type: this.attributes[1].type,
      //   numberOfClusters: numberOfClusters,
      // };

      const params: ICohortMultiAttrDBDataParams = {
        cohortId: cht.dbId,
        attributes: attributesParam,
        numberOfClusters: numberOfClusters,
      };

      newCohortIds = await createDBCohortAutomatically(params)
      console.log("createAutomatically scatterplot data", newCohortIds);
    }

    let cohortDescs: INewCohortDesc[];
    cohortDescs = [];
    // for every selected cohort
    for (const cohort of this.cohorts) {
      // for every newCohort create a filter (for now... the filter is actually not needed, will be changed in the future)
      for (const newCohort of newCohortIds){
        cohortDescs.push({
          cohort: cohort,
          newCohortId: newCohort,
          attr:[this.attributes[0], this.attributes[1]]
        });
      }
    }

    this.container.dispatchEvent(new AutoSplitEvent(cohortDescs));
  }

  getSpec(data: IdValuePair[]): VegaLiteSpec {
    if (!(this.attributes.length === 2 && this.attributes.every((attr) => ['categorical', 'string'].includes(attr.type)))) {
      throw new Error(`Area chart requires attributes of type categorical`); // TODO generalize, could also be used for binned numerical
    }

    const scatterSpec: VegaLiteSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      data: { values: data },
      padding: { left: 5, top: 0, right: 5, bottom: 5 },
      mark: { type: 'square', tooltip: true },
      encoding: {
        row: {
          field: this.attributes[0].dataKey,
          type: 'nominal',
          spacing: -2, // 0 is not enough, more than -2 makes no difference
          header: {
            labelAngle: 0,
            labelAlign: 'left',
            title: null, // We will set a descriptive title for the whole plot
          },
        },
        x: {
          field: this.attributes[1].dataKey,
          type: 'nominal',
          title: null,
        },
        y: {
          field: DATA_LABEL,
          type: 'nominal',
          axis: null, // hide cohort names
        },
        color: {
          // bars will only change color on selection if the type is ordinal/nominal
          // for quantitative this does not work due the applied data transofrmations (binning)
          // which leads to errors on select/hovering selected data (data in the interval)
          field: DATA_LABEL,
          type: 'nominal',
          scale: { domain: getCohortLabels(this.cohorts) },
          legend: null, // custom legend
        },
        size: {
          aggregate: 'count',
          type: 'quantitative',
          scale: { type: 'linear' },
        },
      },
      view: { cursor: 'pointer' },
    };

    // Get base spec, merge with above
    const vegaLiteSpec: VegaLiteSpec = Object.assign(super.getSpec(data), scatterSpec);
    delete vegaLiteSpec.autosize; // does not work for facetted charts
    delete vegaLiteSpec.width; // determine by step size
    // this.addIntervalSelection(vegaLiteSpec); // add interval selection

    return Object.assign(vegaLiteSpec, this.vegaLiteOptions);
  }

  /**
   * From == To for categorical data, e.g. FROM: male, TO: male
   * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
   */
  getSelectedData(): { cohort: ICohort; from: string | number; to: string | number }[] {
    return [];
  }

  filter() {
    log.error('filter is not implemented');
  }

  split() {
    log.error('split is not implemented');
  }

  addControls() {
    // log.info('no controls for Area Chart yet');
    this.controls.insertAdjacentHTML(
      'afterbegin',
      `
    <div>
      <!-- Nav tabs -->
      <ul class="nav nav-tabs nav-justified" role="tablist">
        <li role="presentation" class="nav-item"><a class="nav-link" href="#split" aria-controls="split" role="tab" data-bs-toggle="tab"><i class="fas fa-share-alt" aria-hidden="true"></i> Split</a></li>
      </ul>
      <!-- Tab panes -->
      <div class="tab-content">
        <div role="tabpanel" class="tab-pane" id="split">
          <!-- INSERT SPLIT CONTROLS HERE -->
        </div>
      </div>
    </div>
    <div class="d-grid gap-2">
      <div id="autoSplitControls">
            <!-- INSERT autoSplitControls CONTROLS HERE -->
            <div class="d-grid gap-2">
              <button type="button" class="btn createAutomaticallyBtn btn-coral-prime" title="Calculate meaningful splits.">Create cohorts automatically</button>
              <label>Number of Clusters</label>
              <input type="number" class="clusters" step="any" min="1" max="99" value="2" />
              <button type="button" class="btn createAutomaticallyWithNumberOfClustersBtn btn-coral-prime" title="Calculate meaningful splits.">Create cohorts for number of clusters</button>
            </div>
      </div>
    </div>
    `,
    );





    // for each attribute type, add the respective controls:
    for (const [i, attr] of this.attributes.entries()) {
      if (attr.type === 'number') {
        const axis = i === 0 ? 'x' : 'y';
        this.addIntervalControls(attr, axis);
      }
    }

    select(this.controls)
      .select('button.createAutomaticallyBtn')
      .on('click', () => {
        console.log("createAutomaticallyBtn clicked");
        this.createAutomatically(false);
      });

    select(this.controls)
      .select('button.createAutomaticallyWithNumberOfClustersBtn')
      .on('click', () => {
        console.log("createAutomaticallyWithNumberOfClustersBtn clicked");
        this.createAutomatically(true);
      });

    select(this.controls)
      .select('button.recommendSplitBtn')
      .on('click', () => {
        console.log("recommendSplitBtn clicked");
        this.recommendSplit(false);
      });

    select(this.controls)
      .select('button.recommendSplitWithNumberOfClustersBtn')
      .on('click', () => {
        console.log("recommendSplitWithNumberOfClustersBtn clicked");
        this.recommendSplit(true);
      });


    select(this.controls)
      .select('button.applyBtn')
      .on('click', () => {
        const activeTask = select(this.controls).select('.tab-pane.active').attr('id');
        switch (activeTask) {
          case 'filter':
            this.filter();
            break;
          case 'split':
            this.split();
            break;
          default:
            log.error('Unknown task: ', activeTask);
        }
      });
    const that = this; // helper varible to access this instance in the d3 event handler function
    select(this.controls)
      .selectAll('a[role="tab"]')
      .on('click', function () {
        const d3Event = this; // because we use a function this is overwritten by d3, asssign to variable for clarity
        const newTask = (d3Event as HTMLAnchorElement).hash.replace('#', '') as 'filter' | 'split';
        that.toggleFilterSplitMarks(newTask);
      });
  }
}
