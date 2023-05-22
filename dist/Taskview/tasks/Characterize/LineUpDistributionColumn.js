var LineUpDistributionColumn_1;
import { __decorate } from "tslib";
import { format } from 'd3-format';
import { Column, dialogAddons, EAdvancedSortMethod, ECompareValueType, MapColumn, NumberColumn, ScaleMappingFunction, SortByDefault, toolbar, } from 'lineupjs';
let LineUpDistributionColumn = LineUpDistributionColumn_1 = 
//@ts-ignore
class LineUpDistributionColumn extends MapColumn {
    constructor(id, desc, factory) {
        super(id, desc);
        this.numberFormat = DEFAULT_FORMATTER;
        /**
         * currently active filter
         * @type {{min: number, max: number}}
         * @private
         */
        this.currentFilter = noNumberFilter();
        this.min = 0;
        this.max = 1;
        // this.mapping = restoreMapping(desc, factory); // TODO: check, if desc.range and desc.domain can be infered
        this.mapping = new ScaleMappingFunction([desc['min'], desc['max']], 'linear', [0, 1]);
        this.original = this.mapping.clone();
        this.sort = desc.sort || EAdvancedSortMethod.median;
        this.colorMapping = factory.colorMappingFunction(desc.colorMapping || desc.color);
        if (desc.numberFormat) {
            this.numberFormat = format(desc.numberFormat);
        }
        //TODO: infer min and max if it is not given
        this.min = desc['min'];
        this.max = desc['max'];
    }
    getMin() {
        return this.min;
    }
    getMax() {
        return this.max;
    }
    getNumberFormat() {
        return this.numberFormat;
    }
    // https://stackoverflow.com/questions/45309447/calculating-median-javascript
    get_quartile(values, q = 0.5) {
        // 1. quartile: q=0.25 | median: q=0.5 | 3. quartile: q=0.75
        if (values.length === 0)
            return 0;
        values.sort(function (a, b) {
            return a - b;
        });
        var half = Math.floor(values.length * q);
        if (values.length % 2)
            return values[half];
        return (values[half - 1] + values[half]) / 2.0;
    }
    // https://www.sitepoint.com/community/t/calculating-the-average-mean/7302/2
    mean(numbers) {
        var total = 0, i;
        for (i = 0; i < numbers.length; i += 1) {
            total += numbers[i];
        }
        return total / numbers.length;
    }
    get_advanced_value(method, value_list) {
        switch (method) {
            case EAdvancedSortMethod.min:
                return Math.min(...value_list);
            case EAdvancedSortMethod.max:
                return Math.max(...value_list);
            case EAdvancedSortMethod.mean:
                return this.mean(value_list);
            case EAdvancedSortMethod.median:
                return this.get_quartile(value_list);
            case EAdvancedSortMethod.q1:
                return this.get_quartile(value_list, 1);
            case EAdvancedSortMethod.q3:
                return this.get_quartile(value_list, 3);
            default:
                return this.get_quartile(value_list);
        }
    }
    toCompareValue(row) {
        let data = this.getValue(row);
        let value_list = data[0]['value'];
        const method = this.getSortMethod();
        return this.get_advanced_value(method, value_list);
    }
    toCompareValueType() {
        return ECompareValueType.FLOAT;
    }
    getBoxPlotDataFromValueList(data) {
        return {
            mean: this.get_advanced_value(EAdvancedSortMethod.mean, data),
            missing: 0,
            count: data.length,
            kdePoints: [],
            max: this.get_advanced_value(EAdvancedSortMethod.max, data),
            min: this.get_advanced_value(EAdvancedSortMethod.min, data),
            median: this.get_advanced_value(EAdvancedSortMethod.median, data),
            q1: this.get_advanced_value(EAdvancedSortMethod.q1, data),
            q3: this.get_advanced_value(EAdvancedSortMethod.q3, data),
        };
    }
    getBoxPlotData(row) {
        console.log('getBoxPlotData');
        const data = this.getValue(row)[0]['value'];
        if (data == null) {
            return null;
        }
        return this.getBoxPlotDataFromValueList(data);
    }
    getRawBoxPlotData(row) {
        console.log('getRawBoxPlotData');
        const data = this.getRawValue(row)[0]['value'];
        if (data == null) {
            return null;
        }
        return this.getBoxPlotDataFromValueList(data);
    }
    getRange() {
        console.log('getRange');
        return this.mapping.getRange(this.numberFormat);
    }
    getColorMapping() {
        console.log('getColorMapping');
        return this.colorMapping.clone();
    }
    getNumber(row) {
        // console.log("getNumber")
        return this.mapping.apply(this.toCompareValue(row));
    }
    getRawNumber(row) {
        // console.log("getRawNumber")
        return this.toCompareValue(row);
    }
    iterNumber(row) {
        // console.log("iterNumber")
        const r = this.getValue(row);
        // return r ? r.map((d) => d.value) : [NaN];
        // return r ? r[0]["value"] : [NaN];
        return [this.get_advanced_value(EAdvancedSortMethod.median, r[0]['value'])];
    }
    iterRawNumber(row) {
        // console.log("iterRawNumber")
        const r = this.getRawValue(row);
        // return r ? r.map((d) => d.value) : [NaN];
        // return r ? r[0]["value"] : [NaN];
        //@ts-ignore
        return this.get_advanced_value(EAdvancedSortMethod.median, r.map((d) => d.value || d[0]?.value));
    }
    getValue(row) {
        const values = this.getRawValue(row);
        if (values.length === 0) {
            //@ts-ignore
            return null;
        }
        //@ts-ignore
        return values.map((d) => d.value);
        // //@ts-ignore
        // return values.map(({key, value}) => {
        //   return {
        //     key,
        //     value:
        //       value.length === 0
        //         ? null
        //         : value.map((val) => this.mapping.apply(val)),
        //   };
        // });
    }
    getRawValue(row) {
        const r = super.getValue(row);
        return r == null ? [] : r;
    }
    getExportValue(row, format) {
        return format === 'json' ? this.getRawValue(row) : super.getExportValue(row, format);
    }
    getFormatedLabelArray(arr) {
        return '[' + arr.map((item) => this.numberFormat(item)).toString() + ']';
    }
    getLabels(row) {
        const v = this.getRawValue(row);
        return v.map(({ key, value }) => ({ key, value: this.getFormatedLabelArray(value) }));
    }
    getSortMethod() {
        return this.sort;
    }
    setSortMethod(sort) {
        if (this.sort === sort) {
            return;
        }
        this.fire([LineUpDistributionColumn_1.EVENT_SORTMETHOD_CHANGED], this.sort, (this.sort = sort));
        // sort by me if not already sorted by me
        if (!this.isSortedByMe().asc) {
            this.sortByMe();
        }
    }
    dump(toDescRef) {
        const r = super.dump(toDescRef);
        r.sortMethod = this.getSortMethod();
        r.filter = !isDummyNumberFilter(this.currentFilter) ? this.currentFilter : null;
        r.map = this.mapping.toJSON();
        return r;
    }
    restore(dump, factory) {
        super.restore(dump, factory);
        if (dump.sortMethod) {
            this.sort = dump.sortMethod;
        }
        if (dump.filter) {
            this.currentFilter = restoreNumberFilter(dump.filter);
        }
        if (dump.map || dump.domain) {
            this.mapping = restoreMapping(dump, factory);
        }
    }
    createEventList() {
        return super
            .createEventList()
            .concat([
            LineUpDistributionColumn_1.EVENT_MAPPING_CHANGED,
            LineUpDistributionColumn_1.EVENT_SORTMETHOD_CHANGED,
            LineUpDistributionColumn_1.EVENT_FILTER_CHANGED,
        ]);
    }
    on(type, listener) {
        return super.on(type, listener);
    }
    getOriginalMapping() {
        return this.original.clone();
    }
    getMapping() {
        return this.mapping.clone();
    }
    setMapping(mapping) {
        if (this.mapping.eq(mapping)) {
            return;
        }
        this.fire([LineUpDistributionColumn_1.EVENT_MAPPING_CHANGED, Column.EVENT_DIRTY_VALUES, Column.EVENT_DIRTY], this.mapping.clone(), (this.mapping = mapping));
    }
    getColor(row) {
        return NumberColumn.prototype.getColor.call(this, row);
    }
    isFiltered() {
        return NumberColumn.prototype.isFiltered.call(this);
    }
    getFilter() {
        return NumberColumn.prototype.getFilter.call(this);
    }
    setFilter(value) {
        NumberColumn.prototype.setFilter.call(this, value);
    }
    // filter(row: IDataRow) {
    //   return NumberColumn.prototype.filter.call(this, row);
    // }
    /** @internal */
    isNumberIncluded(filter, value) {
        if (!filter) {
            return true;
        }
        if (Number.isNaN(value)) {
            return !filter.filterMissing;
        }
        return !((isFinite(filter.min) && value < filter.min) || (isFinite(filter.max) && value > filter.max));
    }
    /**
     * filter the current row if any filter is set
     * @param row
     * @returns {boolean}
     */
    // TODO: customize filter: max, min, median...
    filter(row) {
        // currently it checks, if the median is within the range
        // const value = this.getRawNumber(row);
        const value = this.get_advanced_value(EAdvancedSortMethod.median, 
        //@ts-ignore
        this.getRawValue(row).map((v) => v.value));
        return this.isNumberIncluded(this.getFilter(), value);
    }
    clearFilter() {
        return NumberColumn.prototype.clearFilter.call(this);
    }
};
LineUpDistributionColumn.EVENT_MAPPING_CHANGED = NumberColumn.EVENT_MAPPING_CHANGED;
LineUpDistributionColumn.EVENT_COLOR_MAPPING_CHANGED = NumberColumn.EVENT_COLOR_MAPPING_CHANGED;
LineUpDistributionColumn.EVENT_SORTMETHOD_CHANGED = NumberColumn.EVENT_SORTMETHOD_CHANGED;
LineUpDistributionColumn.EVENT_FILTER_CHANGED = NumberColumn.EVENT_FILTER_CHANGED;
LineUpDistributionColumn = LineUpDistributionColumn_1 = __decorate([
    toolbar('rename', 'filterNumber', 'sort', 'sortBy'),
    dialogAddons('sort', 'sortNumbers'),
    SortByDefault('descending')
    //@ts-ignore
], LineUpDistributionColumn);
export { LineUpDistributionColumn };
export const DEFAULT_FORMATTER = format('.3n');
export function noNumberFilter() {
    // return {min: Number.NEGATIVE_INFINITY, max: Number.POSITIVE_INFINITY, filterMissing: false }
    return { min: Number.NaN, max: Number.NaN, filterMissing: false };
}
export function isEqualNumberFilter(a, b, delta = 0.001) {
    return similar(a.min, b.min, delta) && similar(a.max, b.max, delta) && a.filterMissing === b.filterMissing;
}
export function similar(a, b, delta = 0.5) {
    if (a === b) {
        return true;
    }
    return Math.abs(a - b) < delta;
}
export function isUnknown(v) {
    return v === null || v === undefined || isNaN(v);
}
export function isDummyNumberFilter(filter) {
    return !filter.filterMissing && !isFinite(filter.min) && !isFinite(filter.max);
}
export function restoreMapping(desc, factory) {
    if (desc.map) {
        return factory.mappingFunction(desc.map);
    }
    return new ScaleMappingFunction(desc.domain || [0, 1], 'linear', desc.range || [0, 1]);
}
export function restoreNumberFilter(v) {
    return {
        min: v.min != null && isFinite(v.min) ? v.min : -Infinity,
        max: v.max != null && isFinite(v.max) ? v.max : +Infinity,
        filterMissing: v.filterMissing,
    };
}
