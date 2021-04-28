import log from 'loglevel';
import { ServerColumnAttribute } from '../../data/Attribute';
import { DATA_LABEL } from './constants';
import { desc, op, from, rolling, table, not } from 'arquero';
import { getCohortLabel, getCohortLabels } from '../../Cohort';
import { SingleAttributeVisualization, AVegaVisualization } from './AVegaVisualization';
export class KaplanMeierPlot extends SingleAttributeVisualization {
    constructor(vegaLiteOptions = {}) {
        super(vegaLiteOptions);
        this.type = 'quantitative';
        this.options
            .set('95% Confidence Intervals', () => ({ transform: [{ counts: false }] }))
            .set('Hide Confidence Intervals', () => ({ transform: [{ counts: false }] }));
    }
    async getData() {
        const attributes = [this.attribute];
        let missingAttrId = 'days_to_last_followup';
        if (this.attribute.id === 'days_to_last_followup') {
            missingAttrId = 'days_to_death';
        }
        log.debug('Also get data for ', missingAttrId);
        const missingAttr = new ServerColumnAttribute(missingAttrId, this.attribute.view, this.attribute.database, { type: 'number', label: missingAttrId, column: missingAttrId });
        attributes.push(missingAttr);
        if (missingAttrId === 'days_to_death') {
            this.attribute = missingAttr;
        }
        const dataPromises = this.cohorts
            .map((cht, chtIndex) => {
            const promise = new Promise(async (resolve, reject) => {
                const chtDataPromises = attributes.map((attr) => attr.getData(cht.dbId));
                try {
                    const chtData = await Promise.all(chtDataPromises); // array with one entry per attribute, which contains an array with one value for every item in the cohort
                    const mergedChtData = chtData[0].map((_, itemIndex) => chtData.reduce((mergedItem, attribute, i) => Object.assign(mergedItem, attribute[itemIndex]), { [DATA_LABEL]: getCohortLabel(chtIndex, cht) }));
                    resolve(mergedChtData);
                }
                catch (e) {
                    reject(e);
                }
            });
            return promise;
        });
        return Promise.all(dataPromises);
    }
    getSpec(data) {
        if (this.attribute.type !== `number`) {
            throw new Error(`${KaplanMeierPlot.NAME} requires a numerical attribute.`);
        }
        data = this.convertData(data);
        this.field = KaplanMeierPlot.TIME;
        const survivalSpec = {
            height: 300,
            layer: [
                {
                    mark: {
                        type: 'line',
                        interpolate: 'step-after'
                    },
                    encoding: {
                        x: {
                            field: KaplanMeierPlot.TIME,
                            title: 'Time in Days',
                            type: 'quantitative',
                            scale: {
                                domainMin: 0
                            }
                        },
                        y: {
                            field: KaplanMeierPlot.SURVIVAL,
                            title: 'Survival Probability',
                            type: 'quantitative',
                            axis: {
                                format: '.1~%',
                                labelBound: false
                            },
                            scale: {
                                domain: [0, 1],
                                clamp: true
                            }
                        },
                        color: {
                            // bars will only change color on selection if the type is ordinal/nominal
                            // for quantitative this does not work due the applied data transofrmations (binning)
                            // which leads to errors on select/hovering selected data (data in the interval)
                            field: DATA_LABEL,
                            type: 'nominal',
                            legend: null // custom legend
                        }
                    }
                },
                ...this.getOption() === 'Hide Confidence Intervals' ? [ /* add nothing */] : [{
                        mark: {
                            type: 'errorband',
                            interpolate: 'step-after'
                        },
                        encoding: {
                            x: {
                                field: KaplanMeierPlot.TIME,
                                type: 'quantitative'
                            },
                            y: {
                                field: KaplanMeierPlot.SURVIVAL,
                                type: 'quantitative',
                                title: ''
                            },
                            yError: {
                                field: KaplanMeierPlot.ERROR
                            },
                            color: {
                                field: DATA_LABEL,
                                type: 'nominal',
                                legend: null // custom legend
                            }
                        }
                    }],
                {
                    transform: [{
                            filter: {
                                field: 'last_followups', gt: 0
                            }
                        }
                    ],
                    mark: {
                        type: 'tick',
                        opacity: 0.6
                    },
                    encoding: {
                        x: {
                            field: KaplanMeierPlot.TIME,
                            type: 'quantitative'
                        },
                        y: {
                            field: KaplanMeierPlot.SURVIVAL,
                            type: 'quantitative'
                        },
                        color: {
                            field: DATA_LABEL,
                            type: 'nominal',
                            legend: null // custom legend
                        }
                    }
                }, {
                    data: {
                        name: 'splitvalues'
                    },
                    mark: {
                        type: 'rule',
                        strokeDash: [4, 6]
                    },
                    encoding: {
                        x: { field: 'data', type: 'quantitative' }
                    }
                }
            ],
            view: { cursor: 'text' },
            datasets: {
                splitvalues: this.splitValues
            }
        };
        // Get base spec, merge with above
        const vegaLiteSpec = Object.assign(super.getSpec(data), survivalSpec);
        this.addIntervalSelection(vegaLiteSpec); // add interval selection
        return Object.assign(vegaLiteSpec, this.vegaLiteOptions);
    }
    /**
     * Arquero Resources:
     *  https://sphweb.bumc.bu.edu/otlt/mph-modules/bs/bs704_survival/bs704_survival4.html
     *  https://towardsdatascience.com/kaplan-meier-curves-c5768e349479
     *  Test calculations: https://observablehq.com/d/5426a198a7a2dca7
     */
    convertData(data) {
        const aqdata = from(data)
            // we could filter all items that have null for days to death/last followup first, but those will be removed by a later step
            // pre-processing: remove days to last follow for all patients where a death date is available (can only be before death)
            .derive({ days_to_last_followup: (d) => !op.match(/null/, d.days_to_death) && !op.match(/null/, d.days_to_last_followup) ? null : d.days_to_last_followup })
            //
            // Convert to long format (one row per sample, day, and event)
            .fold(not('tissuename', DATA_LABEL), { as: ['event', KaplanMeierPlot.TIME] }) // transform from wide form into long form (one column with days, one column showing which event (death/last followup)
            .filter((d) => !op.match(/null/, d.days)) //drop missing data
            //
            .groupby(DATA_LABEL, KaplanMeierPlot.TIME, 'event') // group by cohort and days to calc events (#deaths, #followups), group by event so that the events can be directly counted with ...
            .count() // sum up same events of each day per group
            //
            .concat(table({ Cohort: getCohortLabels(this.cohorts), days: [0, 0] })) //ensure to start at zero days
            //
            // convert back to wide format: one column for days, two columns for number of death followup events
            .groupby(DATA_LABEL, KaplanMeierPlot.TIME)
            .pivot('event', 'count')
            //
            // rename columns
            .derive({ deaths: (d) => d.days_to_death || 0, last_followups: (d) => d.days_to_last_followup || 0 })
            //
            // calculate risk
            .groupby(DATA_LABEL).orderby(desc(KaplanMeierPlot.TIME)) // sum up from behind to ease calculation
            .derive({ at_risk: rolling((d) => op.sum(d.deaths) + op.sum(d.last_followups)) })
            //
            // Calculate Survival and error basis, based on https://sphweb.bumc.bu.edu/otlt/mph-modules/bs/bs704_survival/bs704_survival4.html
            .groupby(DATA_LABEL).orderby(KaplanMeierPlot.TIME)
            .derive({
            [KaplanMeierPlot.SURVIVAL]: rolling((d) => op.product(1 - (d.deaths) / d.at_risk)),
            error_sum: rolling((d) => op.sum(d.deaths / (d.at_risk * (d.at_risk - d.deaths)))),
        })
            //
            // calculate actual error, has to be done in a sepeate step because it relies on values just calculated
            // "Greenwoods" Error based on https://sphweb.bumc.bu.edu/otlt/mph-modules/bs/bs704_survival/bs704_survival4.html
            .derive({
            [KaplanMeierPlot.ERROR]: (d) => 1.96 * d.survival * op.sqrt(d.error_sum),
        });
        // not necessary for plotting:
        // .derive({
        //   error_up: d => (d.survival_propability + d.error_95) > 1 ? 1 : (d.survival_propability + d.error_95),
        //   error_down: d => (d.survival_propability - d.error_95) < 0 ? 0 : (d.survival_propability - d.error_95)
        // })
        //aqdata.print({limit: 100}); // print to console
        return aqdata.objects();
    }
    /**
     * From == To for categorical data, e.g. FROM: male, TO: male
     * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
     */
    getSelectedData() {
        const filters = [];
        if (!this.hideVisualization) {
            const selections = this.vegaView.signal(AVegaVisualization.SELECTION_SIGNAL_NAME);
            let attrSelection = selections[KaplanMeierPlot.TIME]; // value == name applied through density transform
            if (!attrSelection || attrSelection.length !== 2) {
                attrSelection = this.vegaView.scale('x').domain();
            }
            this.cohorts.forEach((cohort) => {
                filters.push({ from: attrSelection[0], to: attrSelection[1], cohort });
                const nullFilter = this.getNullValueSelectedData(cohort);
                if (nullFilter) {
                    filters.push(nullFilter);
                }
            });
        }
        else {
            this.cohorts.forEach((cohort) => {
                const nullFilter = this.getNullValueSelectedData(cohort);
                if (nullFilter) {
                    filters.push(nullFilter);
                }
            });
        }
        log.debug('filters', filters);
        return filters;
    }
}
KaplanMeierPlot.NAME = 'Kaplan Meier Plot';
// ATTENTION! with arquero, you can't use variables for identifiers (e.g., data[CALCULATED_ERROR])
KaplanMeierPlot.SURVIVAL = 'survival'; // After applying the transform
KaplanMeierPlot.TIME = 'days'; // After applying the transform
KaplanMeierPlot.ERROR = 'error_95'; // After applying the transform
//# sourceMappingURL=KaplanMeierPlot.js.map