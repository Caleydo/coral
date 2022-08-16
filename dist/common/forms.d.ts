/**
 * Created by sam on 06.03.2017.
 */
import { IDataSourceConfig } from "./config";
import { GeneUtils } from "./GeneUtils";
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
    static COPYNUMBER_SUBTYPE: any;
    static EXPRESSION_SUBTYPE: any;
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
    type: any;
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
    type: any;
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
    type: any;
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
            items: IdTextPair[];
        }>;
        validate: (query: any) => Promise<IdTextPair[]>;
        format: typeof GeneUtils.format;
        tokenSeparators: RegExp;
        defaultTokenSeparator: string;
    };
    useSession: boolean;
};
export declare const FORM_CELLLINE_NAME: {
    type: any;
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
            items: IdTextPair[];
        }>;
        validate: (query: any) => Promise<IdTextPair[]>;
        format: typeof GeneUtils.format;
        tokenSeparators: RegExp;
        defaultTokenSeparator: string;
    };
    useSession: boolean;
};
export declare const FORM_GENE_FILTER: {
    type: any;
    label: string;
    id: string;
    useSession: boolean;
    options: {
        sessionKeySuffix: string;
        defaultSelection: boolean;
        uniqueKeys: boolean;
        badgeProvider: any;
        entries: ({
            name: string;
            value: string;
            type: any;
            multiple: boolean;
            return: string;
            optionsData: any;
            options: {
                placeholder: string;
            };
            search?: undefined;
            validate?: undefined;
            format?: undefined;
        } | {
            name: string;
            value: string;
            type: any;
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
            type: any;
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
    type: any;
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
    type: any;
    label: string;
    id: string;
    useSession: boolean;
    options: {
        sessionKeySuffix: string;
        badgeProvider: any;
        defaultSelection: boolean;
        uniqueKeys: boolean;
        entries: any[];
    };
};
export declare const FORM_CELLLINE_FILTER: {
    type: any;
    label: string;
    id: string;
    useSession: boolean;
    options: {
        sessionKeySuffix: string;
        badgeProvider: any;
        defaultSelection: boolean;
        uniqueKeys: boolean;
        entries: any[];
    };
};
export declare const FORM_TISSUE_OR_CELLLINE_FILTER: {
    type: any;
    label: string;
    id: string;
    useSession: boolean;
    dependsOn: string[];
    options: any;
};
export declare const FORM_COLOR_CODING: {
    type: any;
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
    type: any;
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
    type: any;
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
    type: any;
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
    type: any;
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
    type: any;
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
    type: any;
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
