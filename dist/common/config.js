/**
 * Created by sam on 06.03.2017.
 */
import { Categories } from 'tdp_gene';
import { ColumnDescUtils } from 'tdp_core';
/**
 * maximal number of rows in which just the subset if fetched instead of all
 * @type {number}
 */
export const MAX_FILTER_SCORE_ROWS_BEFORE_ALL = 1000;
export const cellline = {
    idType: 'Cellline',
    name: 'Cell Line',
    db: 'publicdb',
    schema: 'cellline',
    tableName: 'cellline',
    entityName: 'celllinename',
    dbViewSuffix: `_items`,
    base: 'cellline',
    columns: (find) => {
        return [
            ColumnDescUtils.stringCol('id', { label: 'Name' }),
            //categoricalCol('species', desc.columns.species.categories, 'Species', true),
            ColumnDescUtils.categoricalCol('tumortype', find('tumortype').categories, { label: 'Tumor Type' }),
            ColumnDescUtils.categoricalCol('organ', find('organ').categories, { label: 'Organ' }),
            ColumnDescUtils.categoricalCol('gender', find('gender').categories, { label: 'Gender' }),
            ColumnDescUtils.categoricalCol('metastatic_site', find('metastatic_site').categories, { label: 'Metastatic Site', visible: false }),
            ColumnDescUtils.categoricalCol('histology_type', find('histology_type').categories, { label: 'Histology Type', visible: false }),
            ColumnDescUtils.categoricalCol('morphology', find('morphology').categories, { label: 'Morphology', visible: false }),
            ColumnDescUtils.categoricalCol('growth_type', find('growth_type').categories, { label: 'Growth Type', visible: false }),
            ColumnDescUtils.categoricalCol('age_at_surgery', find('age_at_surgery').categories, { label: 'Age at Surgery', visible: false }),
            ColumnDescUtils.categoricalCol('microsatellite_stability_class', find('microsatellite_stability_class').categories, { label: 'Micro Satellite Instability (MSI) Status', visible: false }),
            ColumnDescUtils.numberCol('microsatellite_stability_score', 0, find('microsatellite_stability_score').max, { label: 'Micro Satellite Instability (MSI) Score', visible: false }),
            ColumnDescUtils.categoricalCol('hla_a_allele1', find('hla_a_allele1').categories, { label: 'Human Leukocyte Antigen (HLA) type allele 1', visible: false }),
            ColumnDescUtils.categoricalCol('hla_a_allele2', find('hla_a_allele2').categories, { label: 'Human Leukocyte Antigen (HLA) type allele 2', visible: false }),
            ColumnDescUtils.numberCol('mutational_fraction', 0, find('mutational_fraction').max, { label: 'Mutational Burden', visible: false }),
        ];
    },
    columnInfo: {
        string: ['id'],
        number: ['microsatellite_stability_score', 'mutational_fraction'],
        categorical: ['organ', 'gender', 'tumortype', 'metastatic_site', 'histology_type', 'morphology', 'growth_type', 'microsatellite_stability_class', 'hla_a_allele1', 'hla_a_allele2']
    }
};
export const tissue = {
    idType: 'Tissue',
    name: 'Tissue',
    db: 'publicdb',
    schema: 'tissue',
    tableName: 'tissue',
    entityName: 'tissuename',
    dbViewSuffix: `_items`,
    base: 'tissue',
    columns: (find) => {
        return [
            ColumnDescUtils.stringCol('id', { label: 'Name' }),
            //categoricalCol('species', desc.columns.species.categories, 'Species', true),
            ColumnDescUtils.categoricalCol('tumortype', find('tumortype').categories, { label: 'Tumor Type' }),
            ColumnDescUtils.categoricalCol('organ', find('organ').categories, { label: 'Organ' }),
            ColumnDescUtils.categoricalCol('gender', find('gender').categories, { label: 'Gender' }),
            ColumnDescUtils.stringCol('tumortype_adjacent', { label: 'Tumor Type adjacent', visible: false }),
            ColumnDescUtils.categoricalCol('vendorname', find('vendorname').categories, { label: 'Vendor name', visible: false }),
            ColumnDescUtils.categoricalCol('race', find('race').categories, { label: 'Race', visible: false }),
            ColumnDescUtils.categoricalCol('ethnicity', find('ethnicity').categories, { label: 'Ethnicity', visible: false }),
            ColumnDescUtils.numberCol('age', find('age').min, find('age').max, { label: 'Age', visible: false }),
            ColumnDescUtils.numberCol('days_to_death', 0, find('days_to_death').max, { label: 'Days to death', visible: false }),
            ColumnDescUtils.numberCol('days_to_last_followup', 0, find('days_to_last_followup').max, { label: 'Days to last follow up', visible: false }),
            ColumnDescUtils.categoricalCol('vital_status', find('vital_status').categories, { label: 'Vital status', visible: false }),
            ColumnDescUtils.numberCol('height', 0, find('height').max, { label: 'Height', visible: false }),
            ColumnDescUtils.numberCol('weight', 0, find('weight').max, { label: 'Weight', visible: false }),
            ColumnDescUtils.numberCol('bmi', 0, find('bmi').max, { label: 'Body Mass Index (BMI)', visible: false }),
            ColumnDescUtils.categoricalCol('microsatellite_stability_class', find('microsatellite_stability_class').categories, { label: 'Micro Satellite Instability (MSI) Status', visible: false }),
            ColumnDescUtils.numberCol('microsatellite_stability_score', 0, find('microsatellite_stability_score').max, { label: 'Micro Satellite Instability (MSI) Score', visible: false }),
            ColumnDescUtils.categoricalCol('hla_a_allele1', find('hla_a_allele1').categories, { label: 'Human Leukocyte Antigen (HLA) type allele 1', visible: false }),
            ColumnDescUtils.categoricalCol('hla_a_allele2', find('hla_a_allele2').categories, { label: 'Human Leukocyte Antigen (HLA) type allele 2', visible: false }),
            ColumnDescUtils.numberCol('mutational_fraction', 0, find('mutational_fraction').max, { label: 'Mutational Burden', visible: false }),
        ];
    },
    columnInfo: {
        string: ['id', 'tumortype_adjacent'],
        number: ['age', 'days_to_death', 'days_to_last_followup', 'height', 'weight', 'bmi', 'microsatellite_stability_score', 'mutational_fraction'],
        categorical: ['organ', 'gender', 'tumortype', 'vendorname', 'race', 'ethnicity', 'vital_status', 'microsatellite_stability_class', 'hla_a_allele1', 'hla_a_allele2']
    }
};
function toChromosomes(categories) {
    const order = new Map();
    for (let i = 1; i <= 22; ++i) {
        order.set(String(i), i);
    }
    order.set('x', 23);
    order.set('y', 24);
    order.set('mt', 25);
    categories.sort((a, b) => {
        const an = a.toLowerCase();
        const bn = b.toLowerCase();
        const ai = order.get(an);
        const bi = order.get(bn);
        if (ai === bi) {
            return an.localeCompare(bn);
        }
        if (ai == null) {
            return 1;
        }
        if (bi == null) {
            return -1;
        }
        return ai - bi;
    });
    return categories.map((d, i) => ({ name: d, label: d, value: i }));
}
export const gene = {
    idType: Categories.GENE_IDTYPE,
    name: 'Gene',
    db: 'publicdb',
    schema: 'public',
    tableName: 'gene',
    entityName: 'ensg',
    dbViewSuffix: `_gene_items`,
    base: 'gene',
    columns: (find) => {
        const maxRegion = Math.max(find('seqregionstart').max, find('seqregionend').max);
        return [
            ColumnDescUtils.stringCol('symbol', { label: 'Symbol', width: 120 }),
            ColumnDescUtils.stringCol('id', { label: 'Ensembl' }),
            ColumnDescUtils.stringCol('name', { label: 'Name' }),
            ColumnDescUtils.categoricalCol('chromosome', toChromosomes(find('chromosome').categories), { label: 'Chromosome' }),
            ColumnDescUtils.categoricalCol('biotype', find('biotype').categories, { label: 'Biotype' }),
            ColumnDescUtils.categoricalCol('strand', [{ label: 'reverse strand', name: String(-1) }, { label: 'forward strand', name: String(1) }], { label: 'Strand', visible: false }),
            ColumnDescUtils.numberCol('seqregionstart', 0, maxRegion, { label: 'Seq Region Start', visible: false, extras: { renderer: 'default' } }),
            ColumnDescUtils.numberCol('seqregionend', 0, maxRegion, { label: 'Seq Region End', visible: false, extras: { renderer: 'default' } }),
        ];
    },
    columnInfo: {
        string: ['id', 'symbol', 'name', 'chromosome', 'seqregionstart', 'seqregionend'],
        number: [],
        categorical: ['biotype', 'strand']
    }
};
export const dataSources = [cellline, tissue];
export function chooseDataSource(desc) {
    if (typeof (desc) === 'object') {
        if (desc.sampleType === 'Tissue' || desc.idtype === 'Tissue' || desc.idType === 'Tissue') {
            return tissue;
        }
        else if (desc.sampleType === 'Cellline' || desc.idtype === 'Cellline' || desc.idType === 'Cellline') {
            return cellline;
        }
        else {
            return gene;
        }
    }
    switch (desc) {
        case cellline.name:
            return cellline;
        case tissue.name:
            return tissue;
        case gene.name:
            return gene;
    }
}
/**
 * list of possible types
 */
export const dataSubtypes = {
    number: 'number',
    string: 'string',
    cat: 'cat',
    boxplot: 'boxplot'
};
export const expression = {
    id: 'expression',
    name: 'Expression',
    tableName: 'expression',
    query: 'expression_score',
    dataSubtypes: [
        {
            id: 'tpm',
            name: 'Normalized Gene Expression (TPM Values)',
            type: dataSubtypes.number,
            domain: [-3, 3],
            missingValue: NaN,
            constantDomain: true,
            useForAggregation: 'tpm'
        },
        {
            id: 'counts',
            name: 'Raw Counts',
            type: dataSubtypes.number,
            domain: [0, 10000],
            missingValue: NaN,
            constantDomain: true,
            useForAggregation: 'counts'
        }
    ]
};
export const copyNumber = {
    id: 'copy_number',
    name: 'Copy Number',
    tableName: 'copynumber',
    query: 'copynumber_score',
    dataSubtypes: [
        {
            id: 'relativecopynumber',
            name: 'Relative Copy Number',
            type: dataSubtypes.number,
            domain: [0, 15],
            missingValue: NaN,
            constantDomain: true,
            useForAggregation: 'relativecopynumber'
        },
        {
            id: 'totalabscopynumber',
            name: 'Total Absolute Copy Number',
            type: dataSubtypes.number,
            domain: [0, 15],
            missingValue: NaN,
            constantDomain: true,
            useForAggregation: 'totalabscopynumber'
        },
        {
            id: 'copynumberclass',
            name: 'Copy Number Class',
            type: dataSubtypes.cat,
            categories: toLineUpCategories(Categories.copyNumberCat),
            domain: [0, 100],
            missingValue: Categories.unknownCopyNumberValue,
            useForAggregation: 'copynumberclass'
        }
    ],
};
export const mutation = {
    id: 'mutation',
    name: 'Mutation',
    tableName: 'mutation',
    query: 'alteration_mutation_frequency',
    dataSubtypes: [
        //it is a cat by default but in the frequency case also a number?
        {
            id: 'aa_mutated',
            name: 'AA Mutated',
            type: dataSubtypes.cat,
            categories: toLineUpCategories(Categories.mutationCat),
            useForAggregation: 'aa_mutated',
            domain: [0, 100],
            missingValue: Categories.unknownMutationValue
        },
        //just for single score:
        {
            id: 'aamutation',
            name: 'AA Mutation',
            type: dataSubtypes.string,
            useForAggregation: '',
            domain: [0, 100],
            missingValue: NaN
        },
        {
            id: 'dna_mutated',
            name: 'DNA Mutated',
            type: dataSubtypes.cat,
            categories: toLineUpCategories(Categories.mutationCat),
            useForAggregation: 'dna_mutated',
            domain: [0, 100],
            missingValue: Categories.unknownMutationValue
        },
        //just for single score:
        {
            id: 'dnamutation',
            name: 'DNA Mutation',
            type: dataSubtypes.string,
            useForAggregation: '',
            domain: [0, 100],
            missingValue: NaN
        },
        {
            id: 'zygosity',
            name: 'Zygosity',
            type: dataSubtypes.number,
            domain: [0, 15],
            missingValue: NaN,
            useForAggregation: 'zygosity'
        }
    ]
};
export const depletion = {
    id: 'depletion',
    name: 'Depletion Screen ',
    tableName: 'depletionscore',
    query: 'depletion_score',
    dataSubtypes: [
        {
            id: 'rsa',
            name: 'DRIVE RSA (ER McDonald III et al., Cell, 2017)',
            type: dataSubtypes.number,
            domain: [-3, 3],
            missingValue: NaN,
            constantDomain: false,
            useForAggregation: 'rsa'
        },
        {
            id: 'ataris',
            name: 'DRIVE ATARiS (ER McDonald III et al., Cell, 2017)',
            type: dataSubtypes.number,
            domain: [0, 10000],
            missingValue: NaN,
            constantDomain: false,
            useForAggregation: 'ataris'
        },
        {
            id: 'ceres',
            name: 'Avana CERES (Robin M. Meyers et al., Nature Genetics, 2017)',
            type: dataSubtypes.number,
            domain: [0, 10000],
            missingValue: NaN,
            constantDomain: false,
            useForAggregation: 'ceres'
        }
    ]
};
export const drugScreen = {
    id: 'drug',
    name: 'Drug Screen',
    tableName: 'drugscore',
    query: 'drug_score',
    dataSubtypes: [
        {
            id: 'actarea',
            name: 'Activity Area',
            type: dataSubtypes.number,
            domain: [-3, 3],
            missingValue: NaN,
            constantDomain: false,
            useForAggregation: 'actarea'
        },
        {
            id: 'ic50',
            name: 'IC50',
            type: dataSubtypes.number,
            domain: [-3, 3],
            missingValue: NaN,
            constantDomain: false,
            useForAggregation: 'ic50'
        },
        {
            id: 'ec50',
            name: 'EC50',
            type: dataSubtypes.number,
            domain: [-3, 3],
            missingValue: NaN,
            constantDomain: false,
            useForAggregation: 'ec50'
        }
    ]
};
export const drug = {
    idType: 'Drug',
    name: 'Drug',
    db: 'publicdb',
    schema: 'public',
    tableName: 'tdp_drug',
    entityName: 'drugid',
    base: 'drug',
    columns: () => []
};
export const dataTypes = [expression, copyNumber, mutation];
function toLineUpCategories(arr) {
    return arr.map((a) => ({ label: a.name, name: String(a.value), color: a.color }));
}
/**
 * splits strings in the form of "DATA_TYPE-DATA_SUBTYPE" and returns the corresponding DATA_TYPE and DATA_SUBTYPE objects
 */
export function splitTypes(toSplit) {
    console.assert(toSplit.includes('-'), 'The splitTypes method requires the string to contain a dash ("-")');
    const [type, subtype] = toSplit.split('-');
    return resolveDataTypes(type, subtype);
}
export function resolveDataTypes(dataTypeId, dataSubTypeId) {
    let dataType;
    switch (dataTypeId) {
        case mutation.id:
            dataType = mutation;
            break;
        case expression.id:
            dataType = expression;
            break;
        case copyNumber.id:
            dataType = copyNumber;
            break;
        case depletion.id:
            dataType = depletion;
            break;
        case drugScreen.id:
            dataType = drugScreen;
            break;
    }
    const dataSubType = dataType.dataSubtypes.find((element) => element.id === dataSubTypeId);
    return {
        dataType,
        dataSubType
    };
}
//# sourceMappingURL=config.js.map