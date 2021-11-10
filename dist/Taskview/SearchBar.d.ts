import { IServerColumn } from 'tdp_core';
import { IDataSubtypeConfig } from 'tdp_publicdb';
import { ScoreType } from '../data/Attribute';
import { ISpecialAttribute } from '../data/SpecialAttribute';
export declare class SearchBar {
    private _container;
    private _serachBarInputDiv;
    private _searchBarInput;
    private _searchBarPlaceholder;
    private _optionContainerWrapper;
    private _optionContainer;
    private _optionList;
    private _optionDetail;
    private _optionFocusIndex;
    private _pageSize;
    private _pageNumberGenes;
    private _moreGenes;
    private _databaseColumns;
    private _panelAnnotations;
    private _waitForMoreOptions;
    private _optionWrapperCSSClass;
    private _databaseConfig;
    private _geneDataTypes;
    private _eventListenerCloseOptionWindow;
    private _geneHoverOptionId;
    constructor(parentContainer: HTMLDivElement, database: string, view: string, optionWrapperCSSClass?: string);
    private _createContainer;
    private _getGeneDataTypes;
    private _createStructure;
    private searchID;
    private _showOptionListAndDetail;
    private _getDatabaseColumns;
    private _createAllOptions;
    private _sortDataColumns;
    private _addOptionsToGroup;
    private _updateLoadMoreOption;
    private _getAllPossibleOptions;
    private _createSearchBarGroup;
    _createOption(id: string, type: OptionType, text: string, data: any): IOption;
    private _addAdditionalOptions;
    private _getAdditionalOptionsFromGenePage;
    private _getPanelAnnotation;
    private _getGenePage;
    private _clickHandler;
    private _clickHandlerDetail;
    private _mouseOverHandler;
    private _createSearchBarPlaceholder;
    private _createSearchBarBadge;
    private _addEventListeners;
    private _keyboardControl;
    private _closeOCWCheck;
    private _setArrowKeyFocus;
    private _scrollPagination;
    private _showOCW;
    private _setFocusAndScrollOfOptionList;
    private _setSizeAndPositionOfOCW;
    private _setPlaceholder;
    private _setSearchBarInputWidth;
    private _clearDetail;
    /**
     * Removes any options, loading indicators, or notes that no attributes  were found
     */
    private _clearOptionList;
    private _createDetail;
    private _createGeneDetail;
    private _composeGeneDataTypeName;
    private _composeGeneDataTypeOptId;
    private _createPanelDetail;
    private _createSpecialDetail;
    private _createDBColumnDetail;
    private _removeAllOptionHighlighting;
    private _removeAllSelectedItems;
    private _addAndRemoveClearAll;
    getSearchBarHTMLDivElement(): HTMLDivElement;
    getSelectedOptions(): IOption[];
    removeAllSelectedOptions(): void;
}
export interface ISearchBarGroup {
    groupLabel: string;
    data: Array<IOption>;
}
export declare type OptionType = 'dbc' | 'gene' | 'panel';
export interface IOption {
    optionId: string;
    optionType: OptionType;
    optionText: string;
    optionData?: {
        [key: string]: any;
    };
}
export interface IPanelOption extends IOption {
    optionData: {
        description: string;
        species: string;
    };
}
export interface IScoreOption extends IOption {
    optionData: {
        type: ScoreType;
        subType: IDataSubtypeConfig;
    };
}
export interface IServerColumnOption extends IOption {
    optionData: {
        serverColumn: IServerColumn;
    };
}
export interface ISpecialOption extends IServerColumnOption {
    optionData: {
        serverColumn: IServerColumn;
        sAttrId: string;
        attrOption: string;
        spAttribute: ISpecialAttribute;
    };
}
