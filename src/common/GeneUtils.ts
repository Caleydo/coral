import {Categories, SpeciesUtils} from 'tdp_gene';
import {Select3Utils, ISelect3Item, IdTextPair} from 'tdp_core';
import {gene, IDataSourceConfig, drug} from './config';
import {RestBaseUtils} from 'tdp_core';
import {ICommonDBConfig} from 'tdp_gene';

interface IDrugData extends IdTextPair {
  target?: string;
  moa?: string;
}

// Gene

export class GeneUtils {
  /**
   * Search and autocomplete of the input string for Select3
   *
   * @param {string} query An array of gene symbols
   * @param {number} page Server-side pagination page number
   * @param {number} pageSize Server-side pagination page size
   * @returns {Promise<{more: boolean; items: Readonly<IdTextPair>[]}>} Select3 conformant data structure.
   */
  static searchGene(query: string, page: number, pageSize: number): Promise<{ more: boolean, items: Readonly<IdTextPair>[] }> {
    return RestBaseUtils.getTDPLookup(gene.db, `${gene.base}_gene_items`, {
      column: 'symbol',
      species: SpeciesUtils.getSelectedSpecies(),
      query,
      page,
      limit: pageSize
    });
  }

  /**
   * Validation of a query input via paste or filedrop against the database for Select3
   *
   * @param {string[]} query An array of gene symbols
   * @returns {Promise<Readonly<IdTextPair>[]>} Return the validated gene symbols as id-text pairs.
   */
  static validateGene(query: string[]): Promise<Readonly<IdTextPair>[]> {
    return RestBaseUtils.getTDPData(gene.db, `${gene.base}_gene_items_verify/filter`, {
      column: 'symbol',
      species: SpeciesUtils.getSelectedSpecies(),
      filter_symbol: query,
    });
  }

  /**
   * Formatting of genes within Select3 Searchbox.
   *
   * @param {ISelect3Item<IdTextPair>} item The single gene id-text pair.
   * @param {HTMLElement} node The HTML Element in the DOM.
   * @param {"result" | "selection"} mode The search result items within the dropdown or the selected items inside the search input field.
   * @param {RegExp} currentSearchQuery The actual search query input.
   * @returns {string} The string how the gene is actually rendered.
   */
  static formatGene(item: ISelect3Item<IdTextPair>, node: HTMLElement, mode: 'result' | 'selection', currentSearchQuery?: RegExp) {
    if (mode === 'result') {
      //highlight match
      return `${item.text.replace(currentSearchQuery!, Select3Utils.highlightMatch)} <span class="ensg">${item.id}</span>`;
    }
    return item.text;
  }

  // Cellline and Tissue Select3 options methods

  static search(config: IDataSourceConfig | ICommonDBConfig, query: string, page: number, pageSize: number): Promise<{ more: boolean, items: Readonly<IdTextPair>[] }> {
    return RestBaseUtils.getTDPLookup(config.db, `${config.base}_items`, {
      column: config.entityName,
      species: SpeciesUtils.getSelectedSpecies(),
      query,
      page,
      limit: pageSize
    });
  }

  static validate(config: IDataSourceConfig | ICommonDBConfig, query: string[]): Promise<Readonly<IdTextPair>[]> {
    return RestBaseUtils.getTDPData(config.db, `${config.base}_items_verify/filter`, {
      column: config.entityName,
      species: SpeciesUtils.getSelectedSpecies(),
      [`filter_${config.entityName}`]: query,
    });
  }

  static format(item: ISelect3Item<IdTextPair>, node: HTMLElement, mode: 'result' | 'selection', currentSearchQuery?: RegExp) {
    if (mode === 'result' && currentSearchQuery) {
      //highlight match
      return `${item.text.replace(currentSearchQuery!, Select3Utils.highlightMatch)}`;
    }
    return item.text;
  }

  /**
   * Search and autocomplete of the input string for Select3
   *
   * @param {string} query An array of gene symbols
   * @param {number} page Server-side pagination page number
   * @param {number} pageSize Server-side pagination page size
   * @returns {Promise<{more: boolean; items: Readonly<IDrugData>[]}>} Select3 conformant data structure.
   */
  static searchDrug(query: string, page: number, pageSize: number): Promise<{more: boolean, items: Readonly<IDrugData>[]}> {
    return RestBaseUtils.getTDPLookup(drug.db, `${drug.base}_drug_items`, {
      column: 'drugid',
      species: SpeciesUtils.getSelectedSpecies(),
      query,
      page,
      limit: pageSize
    });
  }

  /**
   * Formatting of drugs within Select3 Searchbox.
   *
   * @param {ISelect3Item<IDrugData>} item The single drug id-text-target trio.
   * @param {HTMLElement} node The HTML Element in the DOM.
   * @param {"result" | "selection"} mode The search result items within the dropdown or the selected items inside the search input field.
   * @param {RegExp} currentSearchQuery The actual search query input.
   * @returns {string} The string how the drug is actually rendered.
   */
  static formatDrug(item: ISelect3Item<IDrugData>, node: HTMLElement, mode: 'result' | 'selection', currentSearchQuery?: RegExp) {
    if (mode === 'result') {
      //highlight match
      return `${item.id.replace(currentSearchQuery!, Select3Utils.highlightMatch)}<br>
      <span class="drug-moa">MoA: ${item.data.moa ? item.data.moa.replace(currentSearchQuery!, Select3Utils.highlightMatch) : item.data.moa}</span><br>
      <span class="drug-target">Target: ${item.data.target ? item.data.target.replace(currentSearchQuery!, Select3Utils.highlightMatch) : item.data.target}</span>`;
    }
    return item.id;
  }

  /**
   * Validation of a query input via paste or filedrop against the database for Select3
   *
   * @param {string[]} query An array of drug drugids
   * @returns {Promise<Readonly<IDrugData>[]>} Return the validated drug drugids.
   */
  static validateDrug(query: string[]): Promise<Readonly<IDrugData>[]> {
    return RestBaseUtils.getTDPData(drug.db, `${drug.base}_drug_items_verify/filter`, {
      column: 'drugid',
      filter_drug: query,
    });
  }

  /**
   * Search and autocomplete of the input string for Select3
   *
   * @param {string} query An array of gene symbols
   * @param {number} page Server-side pagination page number
   * @param {number} pageSize Server-side pagination page size
   * @returns {Promise<{more: boolean; items: Readonly<IdTextPair>[]}>} Select3 conformant data structure.
   */
  static searchDrugScreen(query: string, page: number, pageSize: number): Promise<{more: boolean, items: Readonly<IdTextPair>[]}> {
    const rows= RestBaseUtils.getTDPLookup(drug.db, `drug_screen_items`, {
      column: 'campaign',
      query,
      page,
      limit: pageSize
    });
    return rows;
  }

  /**
   * Validation of a query input via paste or filedrop against the database for Select3
   *
   * @param {string[]} query An array of drugscreen campaigns
   * @returns {Promise<Readonly<IdTextPair>[]>} Return the validated drugscreen campaigns.
   */
  static validateDrugScreen(query: string[]): Promise<Readonly<IdTextPair>[]> {
    return RestBaseUtils.getTDPData(drug.db, `drug_screen_items_verify/filter`, {
      column: 'campaign',
      filter_drug_screen: query,
    });
  }

  /**
   * Formatting of drugsreen within Select3 Searchbox.
   *
   * @param {ISelect3Item<IdTextPair>} item The single id-text-target pair.
   * @param {HTMLElement} node The HTML Element in the DOM.
   * @param {"result" | "selection"} mode The search result items within the dropdown or the selected items inside the search input field.
   * @param {RegExp} currentSearchQuery The actual search query input.
   * @returns {string} The string how the drugscreen is actually rendered.
   */
  static formatDrugScreen(item: ISelect3Item<IdTextPair>, node: HTMLElement, mode: 'result' | 'selection', currentSearchQuery?: RegExp) {
    if (mode === 'result') {
      //highlight match
      return `${item.id.replace(currentSearchQuery!, Select3Utils.highlightMatch)} (${item.text})`;
    }
    return item.id;
  }

  /**
   * Chooses which validation function to use depending on the dataSource provided.
   * @param dataSource
   * @param query
   * @returns {Promise<Readonly<IdTextPair>[]>} Return the validated entity as id-text pairs.
   */
  static validateGeneric(dataSource: IDataSourceConfig, query: string[]): Promise<Readonly<IdTextPair>[]> {
    switch (dataSource.idType) {
      case Categories.GENE_IDTYPE:
        return GeneUtils.validateGene(query);

      // add other cases when needed

      default:
          return GeneUtils.validate(dataSource, query);
    }
  }
}
