import { resolveDataTypes } from 'tdp_publicdb';
import { createCohortWithDepletionScoreFilter, createCohortWithEqualsFilter, createCohortWithGeneEqualsFilter, createCohortWithGeneNumFilter, createCohortWithNumFilter, createCohortWithPanelAnnotationFilter } from '../Cohort';
import { getCohortData, getCohortDepletionScore, getCohortGeneScore, getCohortHist, getCohortPanelAnnotation, getCohortSize, HistRouteType } from '../rest';
import { deepCopy, getSessionStorageItem, log, setSessionStorageItem } from '../util';
import { easyLabelFromFilter, easyLabelFromFilterArray, niceName } from '../utilLabels';
export class Attribute {
    constructor(id, view, database, type) {
        this.id = id;
        this.view = view;
        this.database = database;
        this.type = type;
        this.preferLog = false;
        this.label = niceName(this.id); //default
        this.dataKey = this.id; //identical by default
        // console.log('attribute Option: ', option);
        // console.log('attribute JSON: ', this.toJSON());
    }
    async getData(cohortDbId, filters) {
        const rows = await getCohortData({ cohortId: cohortDbId, attribute: this.id });
        return rows;
    }
    getHist(dbId, filters, bins) {
        const params = {
            cohortId: dbId,
            attribute: this.id
        };
        const type = this.type === 'number' ? HistRouteType.dataNum : HistRouteType.dataCat;
        return this.getHistWithStorage(type, params);
    }
    async getHistWithStorage(histType, params) {
        // define storagekey as cohort dbId and attribute label
        const storageKey = `${params.cohortId}#${this.label}`;
        let histData = getSessionStorageItem(storageKey); // get histogram from session storage
        // check if histogram was saved in sesison storage
        if (histData === null) {
            histData = await getCohortHist(histType, params); // get histrogram from DB
            setSessionStorageItem(storageKey, histData); // save retrieved histogram to session storage
        }
        return histData;
    }
    getCount(cohortDbId, filters) {
        return getCohortSize({ cohortId: cohortDbId });
    }
}
export class ServerColumnAttribute extends Attribute {
    constructor(id, view, database, serverColumn) {
        super(id, view, database, serverColumn.type);
        this.id = id;
        this.view = view;
        this.database = database;
        this.serverColumn = serverColumn;
        this.label = niceName(serverColumn.label);
        this.categories = serverColumn.categories.map((c) => { var _a, _b; return (_b = (_a = c.label) !== null && _a !== void 0 ? _a : c.name) !== null && _b !== void 0 ? _b : String(c); });
    }
    async filter(cht, filter, rangeLabel) {
        if (Array.isArray(filter)) {
            // TODO label
            // const label = rangeLabel ? rangeLabel : filter.map((a) => labelFromFilter(a, this)).join(' / ');
            const label = rangeLabel ? rangeLabel : filter.map((a) => easyLabelFromFilter(a, this.label)).join(' / ');
            return createCohortWithNumFilter(cht, niceName(this.id), label, this.id, filter);
        }
        else {
            // TODO label
            // const label = rangeLabel ? rangeLabel : labelFromFilter(filter, this);
            const label = rangeLabel ? rangeLabel : easyLabelFromFilter(filter, this.label);
            return createCohortWithEqualsFilter(cht, niceName(this.id), label, this.id, this.type === 'number' ? 'true' : 'false', filter.values);
        }
    }
    toJSON() {
        const option = {
            optionId: this.id,
            optionType: 'dbc',
            optionText: null,
            optionData: {
                serverColumn: this.serverColumn,
            }
        };
        return {
            option,
            currentDB: this.database,
            currentView: this.view
        };
    }
}
export class SpecialAttribute extends Attribute {
    constructor(id, view, database, spAttribute, attrOption) {
        super(id, view, database, spAttribute.type);
        this.id = id;
        this.view = view;
        this.database = database;
        this.spAttribute = spAttribute;
        this.attrOption = attrOption;
        this.spAttribute.attributeOption = this.attrOption;
        this.label = this.spAttribute.label;
        this.dataKey = this.spAttribute.dataKey;
    }
    async getData(cohortDbId, filters) {
        let rows = [];
        if (this.spAttribute.overrideGetData) {
            rows = await this.spAttribute.getData(cohortDbId);
        } //else {
        //   rows = await super.getData(cohortDbId, filters);
        // }
        return rows;
    }
    async getHist(dbId, filters, bins) {
        if (this.spAttribute.overrideGetHist) {
            return await this.spAttribute.getHist(dbId, filters, bins);
        }
        return null;
    }
    async filter(cht, filter, rangeLabel) {
        if (this.spAttribute.overrideFilter) {
            // this.spAttribute.attributeOption = this.attrOption;
            // TODO label
            //const label = rangeLabel ? rangeLabel : labelFromFilterArray(filter, this);
            const filterLabel = easyLabelFromFilterArray(filter, this.label);
            const label = rangeLabel ? rangeLabel : filterLabel;
            return await this.spAttribute.filter(cht, filter, label);
        } //else {
        //   rows = await super.filter(cht, filter);
        // }
        return null;
    }
    toJSON() {
        const option = {
            optionId: this.id,
            optionType: 'dbc',
            optionText: null,
            optionData: {
                spAttribute: this.spAttribute,
                attrOprtion: this.attrOption,
            }
        };
        return {
            option,
            currentDB: this.database,
            currentView: this.view
        };
    }
}
export class AScoreAttribute extends Attribute {
    constructor(id, view, database, type) {
        super(id, view, database, type);
        this.id = id;
        this.view = view;
        this.database = database;
        this.type = type;
    }
    async getCount() {
        return -1; // dummy
    }
}
/**
 * Returns the depletion screen (whatever that is) for the given score sub type id
 * @param subTypeID known subtype ids are  ['rsa', 'ataris', 'ceres'] but we are just checking if it is ceres or not.
 */
function getDepletionscreen(subTypeID) {
    return subTypeID === 'ceres' ? 'Avana' : 'Drive'; // copied form tdp_public 🤷‍♂️
}
/**
 * TODO: Compare with  SingleDepletionScore in tdp_publicdb/src/scores/SingleScore.ts
 */
export class GeneScoreAttribute extends AScoreAttribute {
    constructor(id, gene, view, database, scoreType, scoreSubType) {
        super(id, view, database, subType2Type(scoreSubType.type));
        this.id = id;
        this.gene = gene;
        this.view = view;
        this.database = database;
        this.scoreType = scoreType;
        this.scoreSubType = scoreSubType;
        this.label = gene + ': ' + scoreSubType.name;
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
    async getData(cohortDbId, filters) {
        const param = this.getParam();
        const scoreView = this.getView();
        const scoreFilters = this.updateFilters(filters);
        let scores = [];
        if (this.scoreType === 'depletion') {
            const params = {
                cohortId: cohortDbId,
                table: param.table,
                attribute: param.attribute,
                ensg: param.name,
                depletionscreen: getDepletionscreen(this.scoreSubType.id)
            };
            scores = await getCohortDepletionScore(params);
        }
        else {
            const params = {
                cohortId: cohortDbId,
                table: param.table,
                attribute: param.attribute,
                ensg: param.name
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
    async filter(cht, filter, rangeLabel) {
        const param = this.getParam();
        if (Array.isArray(filter)) {
            // TODO label
            // const label = rangeLabel ? rangeLabel : filter.map((a) => labelFromFilter(a, this)).join(' / ');
            const label = rangeLabel ? rangeLabel : filter.map((a) => easyLabelFromFilter(a, this.label)).join(' / ');
            if (this.scoreType === 'depletion') {
                const depletionscreen = getDepletionscreen(this.scoreSubType.id);
                return createCohortWithDepletionScoreFilter(cht, niceName(this.label), label, param.table, param.attribute, param.name, depletionscreen, filter);
            }
            else {
                return createCohortWithGeneNumFilter(cht, niceName(this.label), label, param.table, param.attribute, param.name, filter);
            }
        }
        else {
            // TODO label
            // const label = rangeLabel ? rangeLabel : labelFromFilter(filter, this);
            const label = rangeLabel ? rangeLabel : easyLabelFromFilter(filter, this.label);
            return createCohortWithGeneEqualsFilter(cht, niceName(this.label), label, param.table, param.attribute, param.name, this.type === 'number' ? 'true' : 'false', filter.values);
        }
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
            target: niceName(this.view)
        };
    }
    /**
     * depletion views are a bit special
     */
    getView() {
        let scoreView = this.view + '_gene_single_score';
        if (this.scoreType === 'depletion') {
            scoreView = 'depletion_' + scoreView; // necessary prefix
        }
        return scoreView;
    }
    /**
     * depletion needs an extra filter
     */
    updateFilters(filters) {
        if (this.scoreType === 'depletion') {
            const depletionscreen = this.scoreSubType.id === 'ceres' ? 'Avana' : 'Drive'; // copied form tdp_public 🤷‍♂️
            if (filters) {
                filters = deepCopy(filters); // don't mess with the cohorts filters
                filters.normal.depletionscreen = depletionscreen;
            }
            else {
                filters = {
                    normal: { depletionscreen },
                    lt: {},
                    lte: {},
                    gt: {},
                    gte: {}
                };
            }
        }
        return filters;
    }
    async getHist(dbId, filters, bins) {
        const param = this.getParam();
        let params = {
            cohortId: dbId,
            attribute: param.attribute,
            table: param.table,
            ensg: param.name
        };
        let type = this.type === 'number' ? HistRouteType.geneScoreNum : HistRouteType.geneScoreCat;
        // depletion score
        if (this.scoreType === 'depletion') {
            const depletionscreen = this.scoreSubType.id === 'ceres' ? 'Avana' : 'Drive'; // copied form tdp_public
            params.depletionscreen = depletionscreen;
            params = params;
            type = HistRouteType.depletionScore;
        }
        return this.getHistWithStorage(type, params);
    }
    toJSON() {
        const option = {
            optionId: this.id,
            optionType: 'gene',
            optionText: this.gene,
            optionData: {
                type: this.scoreType,
                subType: this.scoreSubType
            }
        };
        return {
            option,
            currentDB: this.database,
            currentView: this.view
        };
    }
}
export class PanelScoreAttribute extends AScoreAttribute {
    async getData(cohortDbId, filters) {
        const params = {
            cohortId: cohortDbId,
            panel: this.id
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
    async getHist(dbId, filters, bins) {
        const params = {
            cohortId: dbId,
            panel: this.id
        };
        const type = HistRouteType.panelAnnotation;
        return this.getHistWithStorage(type, params);
    }
    async filter(cht, filter, rangeLabel) {
        if (Array.isArray(filter)) {
            throw new Error('not implemented ☠');
        }
        else {
            // TODO label
            // const label = rangeLabel ? rangeLabel : labelFromFilter(filter, this);
            const label = rangeLabel ? rangeLabel : easyLabelFromFilter(filter, this.label);
            const stringValues = filter.values.map((item) => item.toString()); //convert potential numbers to string
            return createCohortWithPanelAnnotationFilter(cht, niceName(this.id), label, this.id, stringValues);
        }
    }
    toJSON() {
        const option = {
            optionId: this.id,
            optionType: 'panel',
            optionText: null,
        };
        return {
            option,
            currentDB: this.database,
            currentView: this.view
        };
    }
}
export function toAttribute(option, currentDB, currentView) {
    if (option.optionType === 'dbc') {
        if (option.optionData && option.optionData.spAttribute) {
            // Create Special Attribtues
            // if (option.optionData.spA === 'treatment') {
            log.debug('create special Attribute: ', option.optionId);
            log.debug('special Attribute object: ', option.optionData.spAttribute);
            return new SpecialAttribute(option.optionId, currentView, currentDB, option.optionData.spAttribute, option.optionData.attrOption);
        }
        else {
            // Create Attribute
            return new ServerColumnAttribute(option.optionId, currentView, currentDB, option.optionData.serverColumn);
        }
    }
    else {
        // Create ScoreAttribute
        if (option.optionType === 'gene') {
            return new GeneScoreAttribute(option.optionId, option.optionText, currentView, currentDB, option.optionData.type, option.optionData.subType);
        }
        else if (option.optionType === 'panel') {
            return new PanelScoreAttribute(option.optionId, currentView, currentDB, 'categorical');
        }
    }
}
function subType2Type(subType) {
    // one of number, string, cat, boxplot
    switch (subType) {
        case 'number':
        case 'string':
            return subType;
        case 'cat':
            return 'categorical';
        case 'boxplot':
        default:
            throw new Error('No Support for type: ' + subType);
    }
}
export async function multiFilter(baseCohort, attributes, filters) {
    if (attributes.length !== filters.length) {
        throw new Error(`Number of filters has to match the number of attribtues`);
    }
    return multiAttributeFilter(baseCohort, attributes.map((attr, i) => ({ attr, range: filters[i] })));
}
export async function multiAttributeFilter(baseCohort, filters) {
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
//# sourceMappingURL=Attribute.js.map