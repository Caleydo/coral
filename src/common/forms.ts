/**
 * Created by sam on 06.03.2017.
 */

import { SpeciesUtils, FormSubtype } from 'tdp_publicdb';
import { IServerColumn } from 'visyn_core';
import { FormElementType, IFormElement, IFormSelectOption, ValueCache, RestStorageUtils, LineupUtils, RestBaseUtils } from 'tdp_core';
import { gene, IDataSourceConfig, tissue, cellline, dataSources, dataTypes, dataSubtypes, depletion, drugScreen } from './config';
import { GeneUtils } from './GeneUtils';

/**
 * List of ids for parameter form elements
 * Reuse this ids and activate the `useSession` option for form elements to have the same selectedIndex between different views
 */
export class ParameterFormIds {
  static DATA_SOURCE = 'data_source';

  static GENE_SYMBOL = 'gene_symbol';

  static CELLLINE_NAME = 'cellline_name';

  static TISSUE_NAME = 'tissue_name';

  static DRUG_NAME = 'drug_name';

  static SCREEN_TYPE = 'screen_type';

  static DATA_SUBTYPE = 'data_subtype';

  static DATA_HIERARCHICAL_SUBTYPE = 'hierarchical_data_subtype';

  static COPYNUMBER_SUBTYPE = FormSubtype.FORM_COPYNUMBER_SUBTYPE_ID;

  static EXPRESSION_SUBTYPE = FormSubtype.FORM_EXPRESSION_SUBTYPE_ID;

  static AGGREGATION = 'aggregation';

  static COMPARISON_OPERATOR = 'comparison_operator';

  static COMPARISON_VALUE = 'comparison_value';

  static COMPARISON_CN = 'comparison_cn';

  static SCORE_FORCE_DATASET_SIZE = 'maxDirectFilterRows';

  static COLOR_CODING = 'form_color_coding';
}

export const COMPARISON_OPERATORS = [
  { name: '&lt; less than', value: '<', data: '<' },
  { name: '&lt;= less equal', value: '<=', data: '<=' },
  { name: 'not equal to', value: '<>', data: '<>' },
  { name: '&gt;= greater equal', value: '>=', data: '>=' },
  { name: '&gt; greater than', value: '>', data: '>' },
];

export const CATEGORICAL_AGGREGATION = [
  { name: 'Frequency', value: 'frequency', data: 'frequency' },
  { name: 'Count', value: 'count', data: 'count' },
];

export const NUMERIC_AGGREGATION = [
  { name: 'Average', value: 'avg', data: 'avg' },
  { name: 'Median', value: 'median', data: 'median' },
  { name: 'Min', value: 'min', data: 'min' },
  { name: 'Max', value: 'max', data: 'max' },
  { name: 'Frequency', value: 'frequency', data: 'frequency' },
  { name: 'Count', value: 'count', data: 'count' },
  { name: 'Boxplot', value: 'boxplot', data: 'boxplot' },
  { name: 'Raw Matrix', value: 'numbers', data: 'numbers' },
];

function buildPredefinedNamedSets(ds: IDataSourceConfig) {
  return RestBaseUtils.getTDPData<{ id: string }>(ds.db, `${ds.base}_panel`).then((panels: { id: string }[]) => panels.map((p) => p.id));
}

export const FORM_GENE_NAME = {
  type: FormElementType.SELECT3,
  label: 'Gene Symbol',
  id: ParameterFormIds.GENE_SYMBOL,
  attributes: {
    style: 'width:100%',
  },
  required: true,
  options: {
    placeholder: 'Start typing...',
    optionsData: [],
    search: GeneUtils.searchGene,
    validate: GeneUtils.validateGene,
    format: GeneUtils.formatGene,
  },
  useSession: true,
};

export const FORM_DRUG_NAME = {
  type: FormElementType.SELECT3,
  label: 'Drug Name',
  id: ParameterFormIds.DRUG_NAME,
  attributes: {
    style: 'width:100%',
  },
  required: true,
  options: {
    placeholder: 'Start typing...',
    optionsData: [],
    search: GeneUtils.searchDrug,
    validate: GeneUtils.validateDrug,
    format: GeneUtils.formatDrug,
  },
  useSession: true,
};

function generateNameLookup(d: IDataSourceConfig, field: string) {
  return {
    type: FormElementType.SELECT3,
    label: d.name,
    id: field,
    attributes: {
      style: 'width:100%',
    },
    required: true,
    options: {
      placeholder: 'Start typing...',
      optionsData: [],
      search: (query, page, pageSize) => GeneUtils.search(d, query, page, pageSize),
      validate: (query) => GeneUtils.validate(d, query),
      format: GeneUtils.format,
      tokenSeparators: /[\r\n;,]+/gm,
      defaultTokenSeparator: ';',
    },
    useSession: true,
  };
}

export const FORM_TISSUE_NAME = generateNameLookup(tissue, ParameterFormIds.TISSUE_NAME);
export const FORM_CELLLINE_NAME = generateNameLookup(cellline, ParameterFormIds.CELLLINE_NAME);

// see also tdp_bi_bioinfodb/src/index.ts -> the session will be preset there

export const FORM_GENE_FILTER = {
  type: FormElementType.MAP,
  label: `Filter:`,
  id: 'filter',
  useSession: true,
  options: {
    sessionKeySuffix: `-${SpeciesUtils.getSelectedSpecies()}-gene`,
    defaultSelection: false,
    uniqueKeys: true,
    badgeProvider: LineupUtils.previewFilterHint(gene.db, 'gene', () => ({ filter_species: SpeciesUtils.getSelectedSpecies() })),
    entries: [
      {
        name: 'Bio Type',
        value: 'biotype',
        type: FormElementType.SELECT2,
        multiple: true,
        return: 'id',
        optionsData: ValueCache.getInstance().cachedLazy(`${SpeciesUtils.getSelectedSpecies()}_gene_biotypes`, () =>
          RestBaseUtils.getTDPData<{ text: string }>(gene.db, 'gene_unique_all', {
            column: 'biotype',
            species: SpeciesUtils.getSelectedSpecies(),
          }).then((r) => r.map((d) => d.text)),
        ),
        options: {
          placeholder: 'Start typing...',
        },
      },
      {
        name: 'Strand',
        value: 'strand',
        type: FormElementType.SELECT2,
        multiple: true,
        return: 'id',
        optionsData: ValueCache.getInstance().cachedLazy(`${SpeciesUtils.getSelectedSpecies()}_gene_strands`, () =>
          RestBaseUtils.getTDPData<{ text: string | number }>(gene.db, `gene_unique_all`, {
            column: 'strand',
            species: SpeciesUtils.getSelectedSpecies(),
          }).then((r) => r.map((d) => ({ name: `${d.text === -1 ? 'reverse' : 'forward'} strand`, value: d.text }))),
        ),
        options: {
          placeholder: 'Start typing...',
        },
      },
      {
        name: 'Chromosome',
        value: 'chromosome',
        type: FormElementType.SELECT2,
        multiple: true,
        return: 'id',
        optionsData: ValueCache.getInstance().cachedLazy(`${SpeciesUtils.getSelectedSpecies()}_gene_chromosome`, () =>
          RestBaseUtils.getTDPData<{ text: string | number }>(gene.db, `gene_unique_all`, {
            column: 'chromosome',
            species: SpeciesUtils.getSelectedSpecies(),
          }).then((r) => r.map((d) => d.text.toString())),
        ),
        options: {
          placeholder: 'Start typing...',
        },
      },
      {
        name: 'Predefined Named Sets',
        value: 'panel_ensg',
        type: FormElementType.SELECT2,
        multiple: true,
        optionsData: ValueCache.getInstance().cachedLazy(
          `${SpeciesUtils.getSelectedSpecies()}_gene_predefined_namedsets`,
          buildPredefinedNamedSets.bind(null, gene),
        ),
        options: {
          placeholder: 'Start typing...',
        },
      },
      {
        name: 'My Named Sets',
        value: 'namedset4ensg',
        type: FormElementType.SELECT2,
        multiple: true,
        optionsData: RestStorageUtils.listNamedSetsAsOptions.bind(null, gene.idType),
        options: {
          placeholder: 'Start typing...',
        },
      },
      {
        name: 'Gene Symbol',
        value: 'ensg',
        type: FormElementType.SELECT3,
        multiple: true,
        search: GeneUtils.searchGene,
        validate: GeneUtils.validateGene,
        format: GeneUtils.formatGene,
        options: {
          placeholder: 'Start typing...',
        },
      },
    ],
  },
};

function generateTissueSpecificFilter(d: IDataSourceConfig) {
  return [
    {
      name: 'Tumor Type adjacent',
      value: 'tumortype_adjacent',
      type: FormElementType.SELECT2,
      multiple: true,
      return: 'id',
      optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_tumortype_adjacent`, () =>
        RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
          column: 'tumortype_adjacent',
          species: SpeciesUtils.getSelectedSpecies(),
        }).then((r) => r.map((d) => d.text)),
      ),
      options: {
        placeholder: 'Start typing...',
      },
    },
    {
      name: 'Vendor name',
      value: 'vendorname',
      type: FormElementType.SELECT2,
      multiple: true,
      return: 'id',
      optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_vendorname`, () =>
        RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
          column: 'vendorname',
          species: SpeciesUtils.getSelectedSpecies(),
        }).then((r) => r.map((d) => d.text)),
      ),
      options: {
        placeholder: 'Start typing...',
      },
    },
    {
      name: 'Race',
      value: 'race',
      type: FormElementType.SELECT2,
      multiple: true,
      return: 'id',
      optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_race`, () =>
        RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
          column: 'race',
          species: SpeciesUtils.getSelectedSpecies(),
        }).then((r) => r.map((d) => d.text)),
      ),
      options: {
        placeholder: 'Start typing...',
      },
    },
    {
      name: 'Ethnicity',
      value: 'ethnicity',
      type: FormElementType.SELECT2,
      multiple: true,
      return: 'id',
      optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_ethnicity`, () =>
        RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
          column: 'ethnicity',
          species: SpeciesUtils.getSelectedSpecies(),
        }).then((r) => r.map((d) => d.text)),
      ),
      options: {
        placeholder: 'Start typing...',
      },
    },
    {
      name: 'Vital status',
      value: 'vital_status',
      type: FormElementType.SELECT2,
      multiple: true,
      return: 'id',
      optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_vital_status`, () =>
        RestBaseUtils.getTDPData<{ text: string | boolean }>(d.db, `${d.base}_unique_all`, {
          column: 'vital_status',
          species: SpeciesUtils.getSelectedSpecies(),
        }).then((r) => r.map((d) => (d.text === true ? 'true' : 'false'))),
      ),
      options: {
        placeholder: 'Start typing...',
      },
    },
  ];
}

function generateCelllineSpecificFilter(d: IDataSourceConfig) {
  return [
    {
      name: 'Age at Surgery',
      value: 'age_at_surgery',
      type: FormElementType.SELECT2,
      multiple: true,
      return: 'id',
      optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_age_at_surgery`, () =>
        RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
          column: 'age_at_surgery',
          species: SpeciesUtils.getSelectedSpecies(),
        }).then((r) => r.map((d) => d.text)),
      ),
      options: {
        placeholder: 'Start typing...',
      },
    },
    {
      name: 'Growth Type',
      value: 'growth_type',
      type: FormElementType.SELECT2,
      multiple: true,
      return: 'id',
      optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_growth_type`, () =>
        RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
          column: 'growth_type',
          species: SpeciesUtils.getSelectedSpecies(),
        }).then((r) => r.map((d) => d.text)),
      ),
      options: {
        placeholder: 'Start typing...',
      },
    },
    {
      name: 'Histology Type',
      value: 'histology_type',
      type: FormElementType.SELECT2,
      multiple: true,
      return: 'id',
      optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_histology_type`, () =>
        RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
          column: 'histology_type',
          species: SpeciesUtils.getSelectedSpecies(),
        }).then((r) => r.map((d) => d.text)),
      ),
      options: {
        placeholder: 'Start typing...',
      },
    },
    {
      name: 'Metastatic Site',
      value: 'metastatic_site',
      type: FormElementType.SELECT2,
      multiple: true,
      return: 'id',
      optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_metastatic_site`, () =>
        RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
          column: 'metastatic_site',
          species: SpeciesUtils.getSelectedSpecies(),
        }).then((r) => r.map((d) => d.text)),
      ),
      options: {
        placeholder: 'Start typing...',
      },
    },
    {
      name: 'Morphology',
      value: 'morphology',
      type: FormElementType.SELECT2,
      multiple: true,
      return: 'id',
      optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_morphology`, () =>
        RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
          column: 'morphology',
          species: SpeciesUtils.getSelectedSpecies(),
        }).then((r) => r.map((d) => d.text)),
      ),
      options: {
        placeholder: 'Start typing...',
      },
    },
  ];
}

function generateFilter(d: IDataSourceConfig) {
  let specificFilters = [];
  if (d === tissue) {
    specificFilters = generateTissueSpecificFilter(d);
  } else if (d === cellline) {
    specificFilters = generateCelllineSpecificFilter(d);
  }
  return {
    type: FormElementType.MAP,
    label: `Filter:`,
    id: 'filter',
    useSession: true,
    options: {
      sessionKeySuffix: `-${SpeciesUtils.getSelectedSpecies()}-${d.base}`,
      badgeProvider: LineupUtils.previewFilterHint(d.db, d.base, () => ({ filter_species: SpeciesUtils.getSelectedSpecies() })),
      defaultSelection: false,
      uniqueKeys: true,
      entries: [
        {
          name: 'Tumor Type',
          value: 'tumortype',
          type: FormElementType.SELECT2,
          multiple: true,
          return: 'id',
          optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_tumortypes`, () =>
            RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
              column: 'tumortype',
              species: SpeciesUtils.getSelectedSpecies(),
            }).then((r) => r.map((d) => d.text)),
          ),
          options: {
            placeholder: 'Start typing...',
          },
        },
        {
          name: 'Organ',
          value: 'organ',
          type: FormElementType.SELECT2,
          multiple: true,
          return: 'id',
          optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_organs`, () =>
            RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
              column: 'organ',
              species: SpeciesUtils.getSelectedSpecies(),
            }).then((r) => r.map((d) => d.text)),
          ),
          options: {
            placeholder: 'Start typing...',
          },
        },
        {
          name: 'Gender',
          value: 'gender',
          type: FormElementType.SELECT2,
          multiple: true,
          return: 'id',
          optionsData: ValueCache.getInstance().cachedLazy(`${d.base}_${SpeciesUtils.getSelectedSpecies()}_gender`, () =>
            RestBaseUtils.getTDPData<{ text: string }>(d.db, `${d.base}_unique_all`, {
              column: 'gender',
              species: SpeciesUtils.getSelectedSpecies(),
            }).then((r) => r.map((d) => d.text)),
          ),
          options: {
            placeholder: 'Start typing...',
          },
        },
        ...specificFilters,
        {
          name: 'Predefined Named Sets',
          value: `panel_${d.entityName}`,
          type: FormElementType.SELECT2,
          multiple: true,
          optionsData: ValueCache.getInstance().cachedLazy(
            `${d.base}_${SpeciesUtils.getSelectedSpecies()}_predefined_namedsets`,
            buildPredefinedNamedSets.bind(null, d),
          ),
          options: {
            placeholder: 'Start typing...',
          },
        },
        {
          name: 'My Named Sets',
          value: `namedset4${d.entityName}`,
          type: FormElementType.SELECT2,
          multiple: true,
          optionsData: RestStorageUtils.listNamedSetsAsOptions.bind(null, d.idType),
          options: {
            placeholder: 'Start typing...',
          },
        },
        {
          name: d.name,
          value: d.entityName,
          type: FormElementType.SELECT3,
          multiple: true,
          search: (query, page, pageSize) => GeneUtils.search(d, query, page, pageSize),
          validate: (query) => GeneUtils.validate(d, query),
          format: GeneUtils.format,
          tokenSeparators: /[\r\n;,]+/gm,
          defaultTokenSeparator: ';',
          placeholder: 'Start typing...',
        },
      ],
    },
  };
}

export const FORM_DATA_SOURCE = {
  type: FormElementType.SELECT,
  label: 'Data Source',
  id: ParameterFormIds.DATA_SOURCE,
  required: true,
  options: {
    optionsData: dataSources.map((ds) => {
      return { name: ds.name, value: ds.name, data: ds };
    }),
  },
  useSession: true,
};

export const FORM_TISSUE_FILTER = generateFilter(tissue);
export const FORM_CELLLINE_FILTER = generateFilter(cellline);
export const FORM_TISSUE_OR_CELLLINE_FILTER = {
  type: FormElementType.MAP,
  label: `Filter:`,
  id: 'filter',
  useSession: true,
  dependsOn: [ParameterFormIds.DATA_SOURCE],
  options: <any>{
    sessionKeySuffix: '-choose',
    defaultSelection: false,
    uniqueKeys: true,
    badgeProvider: (filter: any, dataSource: IFormElement) => {
      const { value } = dataSource;
      const data = value ? value.data : null;
      if (data === tissue || data === tissue.name) {
        return FORM_TISSUE_FILTER.options.badgeProvider(filter);
      }
      if (data === cellline || data === cellline.name) {
        return FORM_CELLLINE_FILTER.options.badgeProvider(filter);
      }
      return '';
    },
    entries: (dataSource: IFormElement) => {
      const { value } = dataSource;
      const data = value ? value.data : null;
      if (data === tissue || data === tissue.name) {
        return FORM_TISSUE_FILTER.options.entries;
      }
      if (data === cellline || data === cellline.name) {
        return FORM_CELLLINE_FILTER.options.entries;
      }
      return [];
    },
  },
};

export const FORM_COLOR_CODING = {
  type: FormElementType.SELECT,
  label: 'Color Coding',
  id: ParameterFormIds.COLOR_CODING,
  dependsOn: [ParameterFormIds.DATA_SOURCE],
  options: {
    optionsData: (depends) => {
      const value = depends[0];
      const data = value ? value.data : null;
      if (data === tissue || data === tissue.name) {
        return addEmptyOption(selectCategoricalColumn(tissue));
      }
      if (data === cellline || data === cellline.name) {
        return addEmptyOption(selectCategoricalColumn(cellline));
      }
      return [];
    },
  },
  useSession: false,
};

function selectCategoricalColumn(ds: IDataSourceConfig) {
  const dummy: IServerColumn = {
    type: 'string',
    column: '',
    label: '',
    categories: [],
    min: 0,
    max: 1,
  };
  const cats = ds.columns(() => dummy).filter((d) => d.type === 'categorical');

  return cats.map((c) => ({ name: c.label, value: (<any>c).column, data: (<any>c).column }));
}

function addEmptyOption(options: IFormSelectOption[]) {
  return [{ name: 'None', value: '', data: null }].concat(options);
}

export const FORM_DATA_HIERARCHICAL_SUBTYPE = {
  type: FormElementType.SELECT2_MULTIPLE,
  label: 'Data Type',
  id: ParameterFormIds.DATA_HIERARCHICAL_SUBTYPE,
  attributes: {
    style: 'width:100%',
  },
  required: true,
  options: {
    placeholder: 'Start typing...',
    data: dataTypes.map((ds) => {
      return {
        text: ds.name,
        children: ds.dataSubtypes.map((dss) => ({
          id: `${ds.id}-${dss.id}`,
          text: dss.name,
        })),
      };
    }),
  },
  useSession: true,
};

export const FORM_DATA_HIERARCHICAL_SUBTYPE_AGGREGATED_SELECTION = {
  type: FormElementType.SELECT2,
  label: 'Data Type',
  id: ParameterFormIds.DATA_HIERARCHICAL_SUBTYPE,
  attributes: {
    style: 'width:100%',
  },
  required: true,
  options: {
    placeholder: 'Start typing...',
    data: dataTypes.map((ds) => {
      return {
        text: ds.name,
        // string types can't be aggregated
        children: ds.dataSubtypes
          .filter((d) => d.type !== dataSubtypes.string)
          .map((dss) => ({
            id: `${ds.id}-${dss.id}`,
            text: dss.name,
          })),
      };
    }),
  },
  useSession: true,
};

export const FORM_DATA_HIERARCHICAL_SUBTYPE_DEPLETION = {
  type: FormElementType.SELECT2_MULTIPLE,
  label: 'Data Type',
  id: ParameterFormIds.DATA_HIERARCHICAL_SUBTYPE,
  attributes: {
    style: 'width:100%',
  },
  required: true,
  options: {
    placeholder: 'Start typing...',
    data: depletion.dataSubtypes.map((dss) => ({
      id: `${depletion.id}-${dss.id}`,
      text: dss.name,
    })),
  },
  useSession: true,
};

export const FORM_DATA_HIERARCHICAL_SUBTYPE_AGGREGATED_SELECTION_DEPLETION = {
  type: FormElementType.SELECT2,
  label: 'Data Type',
  id: ParameterFormIds.DATA_HIERARCHICAL_SUBTYPE,
  attributes: {
    style: 'width:100%',
  },
  required: true,
  options: {
    placeholder: 'Start typing...',
    data: depletion.dataSubtypes
      .filter((d) => d.type !== dataSubtypes.string)
      .map((dss) => ({
        id: `${depletion.id}-${dss.id}`,
        text: dss.name,
      })),
  },
  useSession: true,
};

export const FORM_DATA_HIERARCHICAL_SUBTYPE_DRUG = {
  type: FormElementType.SELECT2_MULTIPLE,
  label: 'Data Type',
  id: ParameterFormIds.DATA_HIERARCHICAL_SUBTYPE,
  attributes: {
    style: 'width:100%',
  },
  required: true,
  options: {
    placeholder: 'Start typing...',
    data: drugScreen.dataSubtypes.map((subtype) => ({
      id: `${drugScreen.id}-${subtype.id}`,
      text: subtype.name,
    })),
  },
  useSession: true,
};

export const DRUG_SCREEN_SCORE_FORM_ELEMENT = {
  type: FormElementType.SELECT3,
  label: 'Drug Screen',
  id: ParameterFormIds.SCREEN_TYPE,
  attributes: {
    style: 'width:100%',
  },
  required: true,
  options: {
    placeholder: 'Start typing...',
    optionsData: [],
    search: GeneUtils.searchDrugScreen,
    validate: GeneUtils.validateDrugScreen,
    format: GeneUtils.formatDrugScreen,
  },
  useSession: true,
};
