/**
 * Created by sam on 06.03.2017.
 */
import { FormElementType } from 'tdp_core';
import { IDataSourceConfig } from './config';
import { GeneUtils } from './GeneUtils';
/**
 * List of ids for parameter form elements
 * Reuse this ids and activate the `useSession` option for form elements to have the same selectedIndex between different views
 */
export declare class ParameterFormIds {
    static DATA_SOURCE: string;
    static GENE_SYMBOL: string;
    static CELLLINE_NAME: string;
    static TISSUE_NAME: string;
    static DRUG_NAME: string;
    static SCREEN_TYPE: string;
    static DATA_SUBTYPE: string;
    static DATA_HIERARCHICAL_SUBTYPE: string;
    static COPYNUMBER_SUBTYPE: string;
    static EXPRESSION_SUBTYPE: string;
    static AGGREGATION: string;
    static COMPARISON_OPERATOR: string;
    static COMPARISON_VALUE: string;
    static COMPARISON_CN: string;
    static SCORE_FORCE_DATASET_SIZE: string;
    static COLOR_CODING: string;
}
export declare const COMPARISON_OPERATORS: {
    name: string;
    value: string;
    data: string;
}[];
export declare const CATEGORICAL_AGGREGATION: {
    name: string;
    value: string;
    data: string;
}[];
export declare const NUMERIC_AGGREGATION: {
    name: string;
    value: string;
    data: string;
}[];
export declare const FORM_GENE_NAME: {
    type: FormElementType;
    label: string;
    id: string;
    attributes: {
        style: string;
    };
    required: boolean;
    options: {
        placeholder: string;
        optionsData: any[];
        search: typeof GeneUtils.searchGene;
        validate: typeof GeneUtils.validateGene;
        format: typeof GeneUtils.formatGene;
    };
    useSession: boolean;
};
export declare const FORM_DRUG_NAME: {
    type: FormElementType;
    label: string;
    id: string;
    attributes: {
        style: string;
    };
    required: boolean;
    options: {
        placeholder: string;
        optionsData: any[];
        search: typeof GeneUtils.searchDrug;
        validate: typeof GeneUtils.validateDrug;
        format: typeof GeneUtils.formatDrug;
    };
    useSession: boolean;
};
export declare const FORM_TISSUE_NAME: {
    type: FormElementType;
    label: string;
    id: string;
    attributes: {
        style: string;
    };
    required: boolean;
    options: {
        placeholder: string;
        optionsData: any[];
        search: (query: any, page: any, pageSize: any) => Promise<{
            more: boolean;
            items: Readonly<import("tdp_core").IdTextPair>[];
        }>;
        validate: (query: any) => Promise<Readonly<import("tdp_core").IdTextPair>[]>;
        format: typeof GeneUtils.format;
        tokenSeparators: RegExp;
        defaultTokenSeparator: string;
    };
    useSession: boolean;
};
export declare const FORM_CELLLINE_NAME: {
    type: FormElementType;
    label: string;
    id: string;
    attributes: {
        style: string;
    };
    required: boolean;
    options: {
        placeholder: string;
        optionsData: any[];
        search: (query: any, page: any, pageSize: any) => Promise<{
            more: boolean;
            items: Readonly<import("tdp_core").IdTextPair>[];
        }>;
        validate: (query: any) => Promise<Readonly<import("tdp_core").IdTextPair>[]>;
        format: typeof GeneUtils.format;
        tokenSeparators: RegExp;
        defaultTokenSeparator: string;
    };
    useSession: boolean;
};
export declare const FORM_GENE_FILTER: {
    type: FormElementType;
    label: string;
    id: string;
    useSession: boolean;
    options: {
        sessionKeySuffix: string;
        defaultSelection: boolean;
        uniqueKeys: boolean;
        badgeProvider: (rows: import("tdp_core").IFormRow[]) => Promise<string>;
        entries: ({
            name: string;
            value: string;
            type: FormElementType;
            multiple: boolean;
            return: string;
            optionsData: () => Promise<string[]>;
            options: {
                placeholder: string;
            };
            search?: undefined;
            validate?: undefined;
            format?: undefined;
        } | {
            name: string;
            value: string;
            type: FormElementType;
            multiple: boolean;
            return: string;
            optionsData: () => Promise<{
                name: string;
                value: string | number;
            }[]>;
            options: {
                placeholder: string;
            };
            search?: undefined;
            validate?: undefined;
            format?: undefined;
        } | {
            name: string;
            value: string;
            type: FormElementType;
            multiple: boolean;
            optionsData: any;
            options: {
                placeholder: string;
            };
            return?: undefined;
            search?: undefined;
            validate?: undefined;
            format?: undefined;
        } | {
            name: string;
            value: string;
            type: FormElementType;
            multiple: boolean;
            search: typeof GeneUtils.searchGene;
            validate: typeof GeneUtils.validateGene;
            format: typeof GeneUtils.formatGene;
            options: {
                placeholder: string;
            };
            return?: undefined;
            optionsData?: undefined;
        })[];
    };
};
export declare const FORM_DATA_SOURCE: {
    type: FormElementType;
    label: string;
    id: string;
    required: boolean;
    options: {
        optionsData: {
            name: string;
            value: string;
            data: IDataSourceConfig;
        }[];
    };
    useSession: boolean;
};
export declare const FORM_TISSUE_FILTER: {
    type: FormElementType;
    label: string;
    id: string;
    useSession: boolean;
    options: {
        sessionKeySuffix: string;
        badgeProvider: (rows: import("tdp_core").IFormRow[]) => Promise<string>;
        defaultSelection: boolean;
        uniqueKeys: boolean;
        entries: any[];
    };
};
export declare const FORM_CELLLINE_FILTER: {
    type: FormElementType;
    label: string;
    id: string;
    useSession: boolean;
    options: {
        sessionKeySuffix: string;
        badgeProvider: (rows: import("tdp_core").IFormRow[]) => Promise<string>;
        defaultSelection: boolean;
        uniqueKeys: boolean;
        entries: any[];
    };
};
export declare const FORM_TISSUE_OR_CELLLINE_FILTER: {
    type: FormElementType;
    label: string;
    id: string;
    useSession: boolean;
    dependsOn: string[];
    options: any;
};
export declare const FORM_COLOR_CODING: {
    type: FormElementType;
    label: string;
    id: string;
    dependsOn: string[];
    options: {
        optionsData: (depends: any) => {
            name: string;
            value: string;
            data: any;
        }[];
    };
    useSession: boolean;
};
export declare const FORM_DATA_HIERARCHICAL_SUBTYPE: {
    type: FormElementType;
    label: string;
    id: string;
    attributes: {
        style: string;
    };
    required: boolean;
    options: {
        placeholder: string;
        data: {
            text: string;
            children: {
                id: string;
                text: string;
            }[];
        }[];
    };
    useSession: boolean;
};
export declare const FORM_DATA_HIERARCHICAL_SUBTYPE_AGGREGATED_SELECTION: {
    type: FormElementType;
    label: string;
    id: string;
    attributes: {
        style: string;
    };
    required: boolean;
    options: {
        placeholder: string;
        data: {
            text: string;
            children: {
                id: string;
                text: string;
            }[];
        }[];
    };
    useSession: boolean;
};
export declare const FORM_DATA_HIERARCHICAL_SUBTYPE_DEPLETION: {
    type: FormElementType;
    label: string;
    id: string;
    attributes: {
        style: string;
    };
    required: boolean;
    options: {
        placeholder: string;
        data: {
            id: string;
            text: string;
        }[];
    };
    useSession: boolean;
};
export declare const FORM_DATA_HIERARCHICAL_SUBTYPE_AGGREGATED_SELECTION_DEPLETION: {
    type: FormElementType;
    label: string;
    id: string;
    attributes: {
        style: string;
    };
    required: boolean;
    options: {
        placeholder: string;
        data: {
            id: string;
            text: string;
        }[];
    };
    useSession: boolean;
};
export declare const FORM_DATA_HIERARCHICAL_SUBTYPE_DRUG: {
    type: FormElementType;
    label: string;
    id: string;
    attributes: {
        style: string;
    };
    required: boolean;
    options: {
        placeholder: string;
        data: {
            id: string;
            text: string;
        }[];
    };
    useSession: boolean;
};
export declare const DRUG_SCREEN_SCORE_FORM_ELEMENT: {
    type: FormElementType;
    label: string;
    id: string;
    attributes: {
        style: string;
    };
    required: boolean;
    options: {
        placeholder: string;
        optionsData: any[];
        search: typeof GeneUtils.searchDrugScreen;
        validate: typeof GeneUtils.validateDrugScreen;
        format: typeof GeneUtils.formatDrugScreen;
    };
    useSession: boolean;
};
