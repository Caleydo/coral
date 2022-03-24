import { IDTypeManager, UniqueIdManager } from 'tdp_core';
import { ElementProvType } from './CohortInterfaces';
import { createDBCohort, createDBCohortWithDepletionScoreFilter, createDBCohortWithEqualsFilter, createDBCohortWithGeneEqualsFilter, createDBCohortWithGeneNumFilter, createDBCohortWithNumFilter, createDBCohortWithPanelAnnotationFilter, createDBCohortWithTreatmentFilter, dataDBCohortDepletionScoreFilter, dataDBCohortGeneWithEqualsFilter, dataDBCohortGeneWithNumFilter, dataDBCohortPanelAnnotationFilter, dataDBCohortWithEqualsFilter, dataDBCohortWithNumFilter, getCohortData, getCohortSize, sizeDBCohortDepletionScoreFilter, sizeDBCohortGeneWithEqualsFilter, sizeDBCohortGeneWithNumFilter, sizeDBCohortPanelAnnotationFilter, sizeDBCohortWithEqualsFilter, sizeDBCohortWithNumFilter, updateCohortName, valueListDelimiter } from './rest';
import { mergeTwoAllFilters } from './Tasks';
import { deepCopy, handleDataLoadError, handleDataSaveError, log } from './util';
export async function createCohort(labelOne, labelTwo, isInitial, previousCohortId, database, databaseName, schema, table, view, idType, idColumn, filters) {
    const params = {
        name: combineLabelsForDB(labelOne, labelTwo),
        isInitial: isInitial ? 1 : 0,
        previous: previousCohortId,
        database,
        schema,
        table
    };
    log.debug('try new cohort: ', params);
    const dbId = await cohortCreationDBHandler(createDBCohort, params);
    // ATTENTION : database != databaseName
    const cht = new Cohort({ id: `${dbId}`, dbId, labelOne, labelTwo }, [{ values: [] }], { database: databaseName, schema, table, view, idType, idColumn }, filters, null, isInitial);
    log.debug('new cohort: ', cht);
    return cht;
}
function getLegacyEqualsFilter(parentFilters, attribute, categoryOrValue) {
    const thisChtFilter = { normal: {}, lt: {}, lte: {}, gt: {}, gte: {} };
    thisChtFilter.normal[attribute] = categoryOrValue;
    return mergeTwoAllFilters(parentFilters, thisChtFilter); //merge the existing with the new filter
}
function getLegacyRangeFilter(parentFilters, attribute, range) {
    const thisFilter = { normal: {}, lt: {}, lte: {}, gt: {}, gte: {} };
    thisFilter[range.operatorOne][attribute] = range.valueOne;
    if (range.operatorTwo) {
        thisFilter[range.operatorTwo][attribute] = range.valueTwo;
    }
    return mergeTwoAllFilters(parentFilters, thisFilter); //merge the existing with the new filter
}
export async function createCohortWithEqualsFilter(parentCohort, labelOne, labelTwo, attribute, numeric, values) {
    const params = {
        cohortId: parentCohort.dbId,
        name: combineLabelsForDB(labelOne, labelTwo),
        attribute,
        numeric,
        values
    };
    log.debug('try new cohort equals filter: ', params);
    const dbId = await cohortCreationDBHandler(createDBCohortWithEqualsFilter, params);
    const newFilter = getLegacyEqualsFilter(parentCohort.filters, attribute, values);
    // ATTENTION : database != databaseName
    const cht = new Cohort({ id: `${dbId}`, dbId, labelOne, labelTwo }, [{ values }], { database: parentCohort.database, schema: parentCohort.schema, table: parentCohort.table, view: parentCohort.view, idType: parentCohort.idType, idColumn: parentCohort.idColumn }, newFilter);
    log.debug('new cohort with equals filter: ', cht);
    return cht;
}
export async function createCohortWithTreatmentFilter(parentCohort, labelOne, labelTwo, baseAgent, agent, regimen) {
    const params = {
        cohortId: parentCohort.dbId,
        name: combineLabelsForDB(labelOne, labelTwo),
        baseAgent,
        agent,
        regimen
    };
    log.debug('try new cohort equals filter: ', params);
    const dbId = await cohortCreationDBHandler(createDBCohortWithTreatmentFilter, params);
    const newFilter = getLegacyEqualsFilter(parentCohort.filters, 'agent', agent);
    // ATTENTION : database != databaseName
    const cht = new Cohort({ id: `${dbId}`, dbId, labelOne, labelTwo }, [{ values: agent }], { database: parentCohort.database, schema: parentCohort.schema, table: parentCohort.table, view: parentCohort.view, idType: parentCohort.idType, idColumn: parentCohort.idColumn }, newFilter);
    log.debug('new cohort with equals filter: ', cht);
    return cht;
}
export async function createCohortWithNumFilter(parentCohort, labelOne, labelTwo, attribute, ranges) {
    const params = {
        cohortId: parentCohort.dbId,
        name: combineLabelsForDB(labelOne, labelTwo),
        attribute,
        ranges
    };
    log.debug('try new cohort num filter: ', params);
    const dbId = await cohortCreationDBHandler(createDBCohortWithNumFilter, params);
    const newFilter = getLegacyRangeFilter(parentCohort.filters, attribute, ranges[0]);
    // ATTENTION : database != databaseName
    const cht = new Cohort({ id: `${dbId}`, dbId, labelOne, labelTwo }, [ranges], { database: parentCohort.database, schema: parentCohort.schema, table: parentCohort.table, view: parentCohort.view, idType: parentCohort.idType, idColumn: parentCohort.idColumn }, newFilter);
    log.debug('new cohort with num filter: ', cht);
    return cht;
}
export async function createCohortWithGeneNumFilter(parentCohort, labelOne, labelTwo, table, attribute, ensg, ranges) {
    const params = {
        cohortId: parentCohort.dbId,
        name: combineLabelsForDB(labelOne, labelTwo),
        table,
        attribute,
        ensg,
        ranges,
    };
    log.debug('try new cohort gene num filter: ', params);
    const dbId = await cohortCreationDBHandler(createDBCohortWithGeneNumFilter, params);
    // const newFilter = getLegacyRangeFilter(parentCohort.filters, attribute, ranges[0]);
    const newFilter = parentCohort.filters;
    // ATTENTION : database != databaseName
    const cht = new Cohort({ id: `${dbId}`, dbId, labelOne, labelTwo }, [ranges], { database: parentCohort.database, schema: parentCohort.schema, table: parentCohort.table, view: parentCohort.view, idType: parentCohort.idType, idColumn: parentCohort.idColumn }, newFilter);
    log.debug('new cohort with gene num filter: ', cht);
    return cht;
}
export async function createCohortWithGeneEqualsFilter(parentCohort, labelOne, labelTwo, table, attribute, ensg, numeric, values) {
    const params = {
        cohortId: parentCohort.dbId,
        name: combineLabelsForDB(labelOne, labelTwo),
        table,
        attribute,
        ensg,
        numeric,
        values
    };
    log.debug('try new cohort gene equals filter: ', params);
    const dbId = await cohortCreationDBHandler(createDBCohortWithGeneEqualsFilter, params);
    // const newFilter = getLegacyEqualsFilter(parentCohort.filters, attribute, values[0].toString());
    const newFilter = parentCohort.filters;
    // ATTENTION : database != databaseName
    const cht = new Cohort({ id: `${dbId}`, dbId, labelOne, labelTwo }, [{ values }], { database: parentCohort.database, schema: parentCohort.schema, table: parentCohort.table, view: parentCohort.view, idType: parentCohort.idType, idColumn: parentCohort.idColumn }, newFilter);
    log.debug('new cohort with gene equals filter: ', cht);
    return cht;
}
export async function createCohortWithDepletionScoreFilter(parentCohort, labelOne, labelTwo, table, attribute, ensg, depletionscreen, ranges) {
    const params = {
        cohortId: parentCohort.dbId,
        name: combineLabelsForDB(labelOne, labelTwo),
        table,
        attribute,
        ensg,
        ranges,
        depletionscreen
    };
    log.debug('try new cohort depletion score filter: ', params);
    const dbId = await cohortCreationDBHandler(createDBCohortWithDepletionScoreFilter, params);
    // const newFilter = getLegacyRangeFilter(parentCohort.filters, attribute, ranges[0]);
    const newFilter = parentCohort.filters;
    // ATTENTION : database != databaseName
    const cht = new Cohort({ id: `${dbId}`, dbId, labelOne, labelTwo }, [ranges], { database: parentCohort.database, schema: parentCohort.schema, table: parentCohort.table, view: parentCohort.view, idType: parentCohort.idType, idColumn: parentCohort.idColumn }, newFilter);
    log.debug('new cohort with depletion score filter: ', cht);
    return cht;
}
export async function createCohortWithPanelAnnotationFilter(parentCohort, labelOne, labelTwo, panel, values) {
    const params = {
        cohortId: parentCohort.dbId,
        name: combineLabelsForDB(labelOne, labelTwo),
        panel,
        values
    };
    log.debug('try new cohort panel annotation filter: ', params);
    const dbId = await cohortCreationDBHandler(createDBCohortWithPanelAnnotationFilter, params);
    // const newFilter = getLegacyEqualsFilter(parentCohort.filters, panel, values[0].toString());
    const newFilter = parentCohort.filters;
    // ATTENTION : database != databaseName
    const cht = new Cohort({ id: `${dbId}`, dbId, labelOne, labelTwo }, [{ values }], { database: parentCohort.database, schema: parentCohort.schema, table: parentCohort.table, view: parentCohort.view, idType: parentCohort.idType, idColumn: parentCohort.idColumn }, newFilter);
    log.debug('new cohort with panel annotation filter: ', cht);
    return cht;
}
async function cohortCreationDBHandler(craeteDBCohortMethod, params) {
    let dbId;
    try {
        let idResp = null;
        idResp = await craeteDBCohortMethod(params);
        log.debug('id of new cohort: ', idResp);
        if (idResp && idResp.length === 1) {
            dbId = Number(idResp[0]);
        }
    }
    catch (e) {
        handleDataSaveError(e);
    } // end of try-catch
    return dbId;
}
function combineLabelsForDB(labelOne, labelTwo) {
    return `${labelOne}${valueListDelimiter}${labelTwo}`;
}
function splitLabelsFromDB(name) {
    const split = name.split(valueListDelimiter);
    // console.log('name, labels:', {name, split});
    return {
        labelOne: split[0],
        labelTwo: split[1]
    };
}
export function createCohortFromDB(data, provJSON) {
    // ATTENTION : database != databaseName
    const labels = splitLabelsFromDB(data.name);
    const isInitial = data.is_initial === 1 ? true : false;
    const basicValues = {
        id: `${data.id}`,
        dbId: data.id,
        labelOne: labels.labelOne,
        labelTwo: labels.labelTwo
    };
    const databaseValues = {
        database: provJSON.database,
        schema: data.entity_schema,
        table: data.entity_table,
        view: provJSON.view,
        idType: provJSON.idType,
        idColumn: provJSON.idColumn
    };
    const cht = new Cohort(basicValues, provJSON.values, databaseValues, { normal: {}, lt: {}, lte: {}, gt: {}, gte: {} }, null, isInitial);
    const test = cht.size;
    // cht.selected = provJSON.selected;
    return cht;
}
export var cloneFilterTypes;
(function (cloneFilterTypes) {
    cloneFilterTypes[cloneFilterTypes["none"] = 0] = "none";
    cloneFilterTypes[cloneFilterTypes["equals"] = 1] = "equals";
    cloneFilterTypes[cloneFilterTypes["range"] = 2] = "range";
    cloneFilterTypes[cloneFilterTypes["geneScoreRange"] = 3] = "geneScoreRange";
    cloneFilterTypes[cloneFilterTypes["geneScoreEquals"] = 4] = "geneScoreEquals";
    cloneFilterTypes[cloneFilterTypes["depletionScoreRange"] = 5] = "depletionScoreRange";
    cloneFilterTypes[cloneFilterTypes["panelAnnotation"] = 6] = "panelAnnotation";
})(cloneFilterTypes || (cloneFilterTypes = {}));
export class Cohort {
    constructor(basicValues, values, databaseValues, filters = { normal: {}, lt: {}, lte: {}, gt: {}, gte: {} }, sizeReference = null, isInitial = false) {
        this.colorTaskView = null;
        this._selected = false;
        this._hasFilterConflict = false;
        this._bloodline = [];
        this.id = basicValues.id;
        this.dbId = basicValues.dbId;
        this._labelOne = basicValues.labelOne;
        this._labelTwo = basicValues.labelTwo;
        this._combineLabels(false);
        this._database = databaseValues.database;
        this._schema = databaseValues.schema;
        this._view = databaseValues.view;
        this._table = databaseValues.table;
        this.idColumn = databaseValues.idColumn;
        this.idType = databaseValues.idType ? IDTypeManager.getInstance().resolveIdType(databaseValues.idType) : undefined;
        this._children = [];
        this._parents = [];
        this._parentCohorts = [];
        this.sizeReference = sizeReference;
        this.representation = null;
        this.isInitial = isInitial;
        this.isClone = false;
        this._size = undefined;
        this.values = values;
        this._filters = deepCopy(filters);
        this._checkForFilterConflict();
    }
    _checkForFilterConflict() {
        if (this.filters === null) {
            this._hasFilterConflict = true;
        }
        else {
            this._hasFilterConflict = false;
        }
        this._size = undefined;
    }
    hasfilterConflict() {
        // return this._hasFilterConflict;
        return false; // TODO remove legacy code with the filter object and filter conflict check
    }
    _combineLabels(updateDBCohort = true) {
        this.label = `${this._labelOne}: ${this._labelTwo}`;
        // console.log('combineLabels', {updateDBCohort, l1: this._labelOne, l2: this._labelTwo});
        if (updateDBCohort) {
            updateCohortName({ cohortId: this.dbId, name: combineLabelsForDB(this.labelOne, this.labelTwo) });
        }
    }
    setLabels(labelOne, labelTwo) {
        this._labelOne = labelOne;
        this._labelTwo = labelTwo;
        this._combineLabels();
        if (this.representation !== null && this.representation !== undefined) {
            this.representation.setLabel(this._labelOne, this._labelTwo);
        }
    }
    get labelOne() {
        return this._labelOne;
    }
    get labelTwo() {
        return this._labelTwo;
    }
    set parents(parents) {
        this._parents = parents;
        this.updateBloodline();
    }
    get parents() {
        return this._parents;
    }
    /**
     * Returns all parent tasks, which are all the parent elements of this element.
     */
    getTaskParents() {
        return this._parents;
    }
    /**
     * Returns all parent cohorts, which are all the grand-parent elements of this element.
     */
    getCohortParents() {
        const chtParents = [];
        for (const p of this._parents) {
            chtParents.push(...p.parents);
        }
        if (chtParents.length === 0 && !this.isInitial) {
            chtParents.push(...this._parentCohorts);
        }
        return chtParents;
    }
    setCohortParents(chtParents) {
        this._parentCohorts = chtParents;
    }
    set children(children) {
        this._children = children;
    }
    get children() {
        return this._children;
    }
    /**
     * Returns all children tasks, which are all the children elements of this element.
     */
    getTaskChildren() {
        return this._children;
    }
    /**
     * Returns all children cohorts, which are all the grand-children elements of this element.
     */
    getCohortChildren() {
        const chtChildren = [];
        for (const p of this._children) {
            chtChildren.push(...p.children);
        }
        return chtChildren;
    }
    set database(database) {
        this._database = database;
        this._size = undefined;
    }
    get database() {
        return this._database;
    }
    set schema(schema) {
        this._schema = schema;
        this._size = undefined;
    }
    get schema() {
        return this._schema;
    }
    set view(view) {
        this._view = view;
        this._size = undefined;
    }
    get view() {
        return this._view;
    }
    get table() {
        return this._table;
    }
    set table(table) {
        this._table = table;
        this._size = undefined;
    }
    get filters() {
        return this._filters;
    }
    set filters(filters) {
        this._filters = deepCopy(filters);
        this._size = undefined;
        this._checkForFilterConflict();
    }
    get sizeReference() {
        return this._sizeReference;
    }
    set sizeReference(value) {
        this._sizeReference = value;
    }
    get size() {
        if (this._size === undefined) {
            return this._fetchSize().then((size) => {
                this._size = size; // first set size here
                return this._size; // then return
            });
        }
        else {
            return Promise.resolve(this._size); // return resolved promise --> nothing to do
        }
    }
    getRetrievedSize() {
        return this._size;
    }
    get data() {
        return this._fetchData();
    }
    get selected() {
        return this._selected;
    }
    set selected(selected) {
        this._selected = selected;
        if (this.representation) {
            this.representation.setSelection(this._selected);
        }
    }
    async _fetchSize() {
        const params = {
            cohortId: this.dbId
        };
        try {
            if (this.isClone) {
                if (this.usedFilter === cloneFilterTypes.none) {
                    return await getCohortSize(params);
                }
                else if (this.usedFilter === cloneFilterTypes.equals) {
                    return await sizeDBCohortWithEqualsFilter(this.usedFilterParams);
                }
                else if (this.usedFilter === cloneFilterTypes.range) {
                    return await sizeDBCohortWithNumFilter(this.usedFilterParams);
                }
                else if (this.usedFilter === cloneFilterTypes.geneScoreRange) {
                    return await sizeDBCohortGeneWithNumFilter(this.usedFilterParams);
                }
                else if (this.usedFilter === cloneFilterTypes.geneScoreEquals) {
                    return await sizeDBCohortGeneWithEqualsFilter(this.usedFilterParams);
                }
                else if (this.usedFilter === cloneFilterTypes.depletionScoreRange) {
                    return await sizeDBCohortDepletionScoreFilter(this.usedFilterParams);
                }
                else if (this.usedFilter === cloneFilterTypes.panelAnnotation) {
                    return await sizeDBCohortPanelAnnotationFilter(this.usedFilterParams);
                }
            }
            else {
                return await getCohortSize(params);
            }
        }
        catch (e) {
            handleDataLoadError(e);
        }
    }
    async _fetchData() {
        const params = {
            cohortId: this.dbId
        };
        try {
            if (this.isClone) {
                if (this.usedFilter === cloneFilterTypes.none) {
                    return await getCohortData(params);
                }
                else if (this.usedFilter === cloneFilterTypes.equals) {
                    return await dataDBCohortWithEqualsFilter(this.usedFilterParams);
                }
                else if (this.usedFilter === cloneFilterTypes.range) {
                    return await dataDBCohortWithNumFilter(this.usedFilterParams);
                }
                else if (this.usedFilter === cloneFilterTypes.geneScoreRange) {
                    return await dataDBCohortGeneWithNumFilter(this.usedFilterParams);
                }
                else if (this.usedFilter === cloneFilterTypes.geneScoreEquals) {
                    return await dataDBCohortGeneWithEqualsFilter(this.usedFilterParams);
                }
                else if (this.usedFilter === cloneFilterTypes.depletionScoreRange) {
                    return await dataDBCohortDepletionScoreFilter(this.usedFilterParams);
                }
                else if (this.usedFilter === cloneFilterTypes.panelAnnotation) {
                    return await dataDBCohortPanelAnnotationFilter(this.usedFilterParams);
                }
            }
            else {
                log.debug('fetch cohort data');
                const data = await getCohortData(params);
                return data;
            }
        }
        catch (e) {
            handleDataLoadError(e);
        }
    }
    // filter method and params for the function
    clone(usedFilter, filterParams) {
        const clone = new Cohort({ id: this.id + '-clone#' + UniqueIdManager.getInstance().uniqueId('cht:cohort'), dbId: this.dbId, labelOne: this.labelOne, labelTwo: this.labelTwo }, this.values, { database: this.database, schema: this.schema, table: this.table, view: this.view, idType: this.idType, idColumn: this.idColumn }, this.filters, this.sizeReference);
        clone.isClone = true;
        clone.usedFilterParams = filterParams;
        clone.usedFilter = usedFilter;
        return clone;
    }
    // the last element in the bloodline is alway the root cohort
    _getHeritage(heritage, currElem) {
        // add current element
        heritage.push(this._createHeritageElement(currElem));
        // go through all parents and add them
        if (currElem.parents.length > 0) {
            for (const elem of currElem.parents) {
                heritage.concat(this._getHeritage(heritage, elem));
            }
        }
        return heritage;
    }
    _createHeritageElement(currElem) {
        const tmp = {
            obj: currElem,
            elemType: 'task',
            label: currElem.label,
            size: 0
        };
        if (currElem instanceof Cohort) {
            tmp.elemType = 'cohort';
            tmp.size = currElem.getRetrievedSize();
        }
        return tmp;
    }
    getBloodline() {
        if (this._bloodline.length === 0) {
            // create bloodline
            this.updateBloodline();
        }
        return this._bloodline;
    }
    updateBloodline() {
        this._bloodline = this._getHeritage([], this);
    }
    toProvenanceJSON() {
        return {
            id: this.id,
            type: ElementProvType.Cohort,
            label: this.label,
            parent: this._parents.map((elem) => elem.id),
            children: this._children.map((elem) => elem.id),
            attrAndValues: {
                values: this.values,
                view: this._view,
                database: this._database,
                idType: this.idType,
                idColumn: this.idColumn,
                selected: this._selected,
                isRoot: false
            }
        };
    }
}
export const EMPTY_COHORT_ID = '--EMPTY--';
export function getEmptyCohort(parent) {
    const cht = new Cohort({ id: EMPTY_COHORT_ID, dbId: NaN, labelOne: 'Empty', labelTwo: '' }, null, { database: null, schema: null, table: null, view: null, idType: undefined, idColumn: null });
    cht.setCohortParents([parent]);
    return cht;
}
export const LOADER_COHORT_ID = '--LOADING--';
export function getLoaderCohort(parent) {
    const cht = new Cohort({ id: LOADER_COHORT_ID, dbId: NaN, labelOne: 'Loading', labelTwo: '' }, null, { database: null, schema: null, table: null, view: null, idType: undefined, idColumn: null });
    cht.setCohortParents([parent]);
    return cht;
}
export function getCohortLabel(cht) {
    return cht.label;
}
export function getCohortLabels(cohorts) {
    return cohorts.map((cht) => getCohortLabel(cht));
}
//# sourceMappingURL=Cohort.js.map