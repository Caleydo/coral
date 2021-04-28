export declare class OneHotEncoder {
    /**
     *
     * @param data the data to encode
     * @param dataKeys optional subset of the attributes present in the data to not encode labels
     */
    encode(data: Array<any>, attributes: Array<IAttribute>): any[];
    categoryIndices: {
        [attribute: string]: {
            [category: string]: number;
        };
    };
    /**
     *
     * @param attribute numbers start at 0 for every attribute
     * @param category first encountered category will have index 0, second category 1 and so on.
     */
    getNumberForAttributeCategory(attribute: string, category: string): number;
    getNumberOfAttributeCategories(attribute: string): number;
    oneHotArray(length: number, hotIndex: number): any[];
}
/**
 * copy of Attribute.ts (an import would break the worker)
 */
interface IAttribute {
    dataKey: string;
    type: AttributeType;
}
declare type AttributeType = 'categorical' | 'number' | 'string';
export {};
