import {TopLevelSpec as VegaLiteSpec} from 'vega-lite';
import {ICohort} from '../../CohortInterfaces';
import {IdValuePair} from '../../data/Attribute';
import {colors} from '../../colors';
import {log} from '../../util';
import {AVegaVisualization, SingleAttributeVisualization} from './AVegaVisualization';
import {DATA_LABEL} from './constants';

export class VegaHistogram extends SingleAttributeVisualization {
  static readonly NAME = 'Histogram';

  sort: string = null; // == no sort by default}

  getSpec(data: IdValuePair[]): VegaLiteSpec {
    this.field = this.attribute.dataKey;
    this.type = this.attribute.type === `number` ? 'quantitative' : 'nominal';
    const bin = this.type === `quantitative`;

    if (this.type === 'nominal') {
      this.sort = '-x'; // one more transformation! (data_1 isntead data_0)
    } else {
      this.sort = 'ascending';
    }

    const vegaLiteSpecPart: Partial<VegaLiteSpec> = { // Specific to histogram
      mark: {
        type: 'bar',
        tooltip: true,
        cursor: 'pointer'
      },
      height: {step: this.cohorts.length > 1 ? 10 : 15},
      encoding: {
        [this.type === 'quantitative' ? 'x' : 'y']: {
          bin,
          field: this.field,
          type: this.type,
          sort: this.sort,
          title: this.attribute.label,
          scale: {clamp: true}
        },
        [this.type === 'quantitative' ? 'y' : 'x']: {
          aggregate: 'count',
          type: 'quantitative',
          axis: {
            orient: this.type === 'quantitative' ? 'left' : 'top'
          },
          title: 'Count'
        },
        color: {
          // bars will only change color on selection if the type is ordinal/nominal
          // for quantitative this does not work due the applied data transofrmations (binning)
          // which leads to errors on select/hovering selected data (data in the interval)
          field: DATA_LABEL,
          type: 'nominal',
          condition: [
            {
              selection: 'highlight',
              value: colors.hoverColor
            }
          ],
          legend: null  // use custom legend
        },
        fillOpacity: {
          condition: [
            {
              test: {
                or: [
                  {selection: AVegaVisualization.SELECTION_SIGNAL_NAME},
                  {selection: AVegaVisualization.HIGHLIGHT_SIGNAL_NAME}
                ]
              },
              value: 1
            }
          ],
          value: 0.3
        }
      },
    };
    const histSpec: VegaLiteSpec = Object.assign(super.getSpec(data), vegaLiteSpecPart) as VegaLiteSpec; //the combination gives a full spec

    this.addHoverSelection(histSpec);

    if (this.type === 'quantitative') {
      this.addIntervalSelection(histSpec);
    } else {
      this.addMultiSelection(histSpec);
    }

    return Object.assign(histSpec, this.vegaLiteOptions);
  }

  /**
   * From == To for categorical data, e.g. FROM: male, TO: male
   * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
   */
  getSelectedData(): {cohort: ICohort, from: string | number, to: string | number}[] {
    const filters: {cohort: ICohort, from: string | number, to: string | number}[] = [];
    if (this.type === 'quantitative') {
      if(!this.hideVisualization) {
        const selections = this.vegaView.signal(AVegaVisualization.SELECTION_SIGNAL_NAME);
        let attrSelection = selections[this.field];
        if (!attrSelection || attrSelection.length !== 2) {
          attrSelection = this.vegaView.scale('x').domain();
        }
        this.cohorts.forEach((cohort) => {
          filters.push({from: attrSelection[0], to: attrSelection[1], cohort});

          const nullFilter = this.getNullValueSelectedData(cohort);
          if(nullFilter) {
            filters.push(nullFilter);
          }
        });
      } else {
        this.cohorts.forEach((cohort) => {
          const nullFilter = this.getNullValueSelectedData(cohort);
          if(nullFilter) {
            filters.push(nullFilter);
          }
        });
      }
    } else {
      const dataStore = this.sort === '-x' || this.sort === 'x' ? AVegaVisualization.DATA_STORE_1 : AVegaVisualization.DATA_STORE_0; // sorting by frequency adds one more transformation, i.e. data array -> data_1
      const vegaData = this.vegaView.data(dataStore); //default name
      log.debug('vegaData', vegaData);

      const selectionData: any[] = this.vegaView.data(AVegaVisualization.SELECTION_STORE);
      if (selectionData.length > 0) {
        const selectionVegaIds = selectionData.reduce((array, selectedItem) => array.push(...selectedItem.values) && array, []);
        log.debug('selectionData', selectionData);
        const filteredVegaData = vegaData.filter((dataItem) => selectionVegaIds.find((evItemId) => evItemId === dataItem._vgsid_));
        log.debug('filteredVegaData', filteredVegaData);

        // if ordinal or nominal, we can get the selected bins by the name of field
        const selectedBins = filteredVegaData.map((dataItem) => dataItem[this.field]);
        this.cohorts.forEach((cohort) => filters.push(...selectedBins.map((bin) => ({from: bin, to: bin, cohort}))));
      } else {
        //select all
        this.cohorts.forEach((cohort) => filters.push(...vegaData.map((datum) => ({from: datum[this.field], to: datum[this.field], cohort}))));
      }
    }

    log.debug('filters', filters);
    return filters;
  }
}
