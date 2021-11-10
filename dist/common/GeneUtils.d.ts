import { ISelect3Item, IdTextPair } from 'tdp_core';
import { IDataSourceConfig } from './config';
import { ICommonDBConfig } from 'tdp_gene';
interface IDrugData extends IdTextPair {
    target?: string;
    moa?: string;
}
export declare class GeneUtils {
    /**
     * Search and autocomplete of the input string for Select3
     *
     * @param {string} query An array of gene symbols
     * @param {number} page Server-side pagination page number
     * @param {number} pageSize Server-side pagination page size
     * @returns {Promise<{more: boolean; items: Readonly<IdTextPair>[]}>} Select3 conformant data structure.
     */
    static searchGene(query: string, page: number, pageSize: number): Promise<{
        more: boolean;
        items: Readonly<IdTextPair>[];
    }>;
    /**
     * Validation of a query input via paste or filedrop against the database for Select3
     *
     * @param {string[]} query An array of gene symbols
     * @returns {Promise<Readonly<IdTextPair>[]>} Return the validated gene symbols as id-text pairs.
     */
    static validateGene(query: string[]): Promise<Readonly<IdTextPair>[]>;
    /**
     * Formatting of genes within Select3 Searchbox.
     *
     * @param {ISelect3Item<IdTextPair>} item The single gene id-text pair.
     * @param {HTMLElement} node The HTML Element in the DOM.
     * @param {"result" | "selection"} mode The search result items within the dropdown or the selected items inside the search input field.
     * @param {RegExp} currentSearchQuery The actual search query input.
     * @returns {string} The string how the gene is actually rendered.
     */
    static formatGene(item: ISelect3Item<IdTextPair>, node: HTMLElement, mode: 'result' | 'selection', currentSearchQuery?: RegExp): string;
    static search(config: IDataSourceConfig | ICommonDBConfig, query: string, page: number, pageSize: number): Promise<{
        more: boolean;
        items: Readonly<IdTextPair>[];
    }>;
    static validate(config: IDataSourceConfig | ICommonDBConfig, query: string[]): Promise<Readonly<IdTextPair>[]>;
    static format(item: ISelect3Item<IdTextPair>, node: HTMLElement, mode: 'result' | 'selection', currentSearchQuery?: RegExp): string;
    /**
     * Search and autocomplete of the input string for Select3
     *
     * @param {string} query An array of gene symbols
     * @param {number} page Server-side pagination page number
     * @param {number} pageSize Server-side pagination page size
     * @returns {Promise<{more: boolean; items: Readonly<IDrugData>[]}>} Select3 conformant data structure.
     */
    static searchDrug(query: string, page: number, pageSize: number): Promise<{
        more: boolean;
        items: Readonly<IDrugData>[];
    }>;
    /**
     * Formatting of drugs within Select3 Searchbox.
     *
     * @param {ISelect3Item<IDrugData>} item The single drug id-text-target trio.
     * @param {HTMLElement} node The HTML Element in the DOM.
     * @param {"result" | "selection"} mode The search result items within the dropdown or the selected items inside the search input field.
     * @param {RegExp} currentSearchQuery The actual search query input.
     * @returns {string} The string how the drug is actually rendered.
     */
    static formatDrug(item: ISelect3Item<IDrugData>, node: HTMLElement, mode: 'result' | 'selection', currentSearchQuery?: RegExp): string;
    /**
     * Validation of a query input via paste or filedrop against the database for Select3
     *
     * @param {string[]} query An array of drug drugids
     * @returns {Promise<Readonly<IDrugData>[]>} Return the validated drug drugids.
     */
    static validateDrug(query: string[]): Promise<Readonly<IDrugData>[]>;
    /**
     * Search and autocomplete of the input string for Select3
     *
     * @param {string} query An array of gene symbols
     * @param {number} page Server-side pagination page number
     * @param {number} pageSize Server-side pagination page size
     * @returns {Promise<{more: boolean; items: Readonly<IdTextPair>[]}>} Select3 conformant data structure.
     */
    static searchDrugScreen(query: string, page: number, pageSize: number): Promise<{
        more: boolean;
        items: Readonly<IdTextPair>[];
    }>;
    /**
     * Validation of a query input via paste or filedrop against the database for Select3
     *
     * @param {string[]} query An array of drugscreen campaigns
     * @returns {Promise<Readonly<IdTextPair>[]>} Return the validated drugscreen campaigns.
     */
    static validateDrugScreen(query: string[]): Promise<Readonly<IdTextPair>[]>;
    /**
     * Formatting of drugsreen within Select3 Searchbox.
     *
     * @param {ISelect3Item<IdTextPair>} item The single id-text-target pair.
     * @param {HTMLElement} node The HTML Element in the DOM.
     * @param {"result" | "selection"} mode The search result items within the dropdown or the selected items inside the search input field.
     * @param {RegExp} currentSearchQuery The actual search query input.
     * @returns {string} The string how the drugscreen is actually rendered.
     */
    static formatDrugScreen(item: ISelect3Item<IdTextPair>, node: HTMLElement, mode: 'result' | 'selection', currentSearchQuery?: RegExp): string;
    /**
     * Chooses which validation function to use depending on the dataSource provided.
     * @param dataSource
     * @param query
     * @returns {Promise<Readonly<IdTextPair>[]>} Return the validated entity as id-text pairs.
     */
    static validateGeneric(dataSource: IDataSourceConfig, query: string[]): Promise<Readonly<IdTextPair>[]>;
}
export {};
