import { select } from 'd3-selection';
import { RestBaseUtils } from 'tdp_core';
import { dataTypes, depletion } from 'tdp_publicdb';
import { colors } from '../colors';
import { checkSpecialAttribute } from '../data/SpecialAttribute';
import { deepCopy, getAnimatedLoadingText, log } from '../util';
import { niceName } from '../utilLabels';
export class SearchBar {
    constructor(parentContainer, database, view, optionWrapperCSSClass = 'standard') {
        this.searchID = 0;
        this._pageSize = 30;
        this._pageNumberGenes = 0;
        this._moreGenes = false;
        this._waitForMoreOptions = false;
        this._databaseColumns = null;
        this._panelAnnotations = null;
        this._optionWrapperCSSClass = optionWrapperCSSClass;
        this._databaseConfig = {
            database,
            view
        };
        // get all needed gene data types (e.g. Copy Number)
        this._geneDataTypes = this._getGeneDataTypes(view);
        log.debug('SearchBar Configuration - with the database and view: ', { database, view, pageSize: this._pageSize });
        // create placeholder
        this._createSearchBarPlaceholder();
        // create container element for the search bar
        this._createContainer(parentContainer);
        this._optionFocusIndex = -1;
        // create the neeeded structure
        this._createStructure();
        // get all possible options
        this._getAllPossibleOptions('');
        this._eventListenerCloseOptionWindow = (e) => this._closeOCWCheck(e.target);
        // add all EventListeners
        this._addEventListeners();
    }
    _createContainer(parentContainer) {
        while (parentContainer.hasChildNodes()) {
            parentContainer.removeChild(parentContainer.lastChild);
        }
        this._container = document.createElement('div');
        this._container.className = 'search-bar-container';
        parentContainer.appendChild(this._container);
    }
    _getGeneDataTypes(view) {
        // datatypes from tdp_publicdb/src/config.ts
        const types = deepCopy(dataTypes);
        if (view === 'cellline') {
            types.push(deepCopy(depletion));
        }
        for (const dt of types) {
            for (const subdt of dt.dataSubtypes) {
                subdt.dataTypeId = dt.id;
            }
        }
        // log.debug('Gene data types: ', types);
        return types;
    }
    _createStructure() {
        // ---- input to filter options
        // create span element for the input
        const searchBarDiv = document.createElement('div');
        searchBarDiv.className = 'input-badge';
        this._serachBarInputDiv = searchBarDiv;
        this._container.appendChild(this._serachBarInputDiv); // append element to this._container
        // input element to use for the filtering of the options
        this._searchBarInput = document.createElement('input');
        this._searchBarInput.className = 'search-bar-input';
        // this._searchBarInput.placeholder = '&#xf002; Select one or more attributes';
        this._searchBarInput.type = 'text';
        this._serachBarInputDiv.appendChild(this._searchBarInput); // append element to the span element
        // ---- options and their detail
        // option container wrapper
        select(document.body).selectAll(`div.option-container-wrapper.option-element.${this._optionWrapperCSSClass}`).remove();
        this._optionContainerWrapper = document.createElement('div');
        this._optionContainerWrapper.classList.add('option-container-wrapper', 'option-element', `${this._optionWrapperCSSClass}`);
        this._setSizeAndPositionOfOCW();
        document.body.appendChild(this._optionContainerWrapper);
        this._showOCW(false);
        // option container
        this._optionContainer = document.createElement('div');
        this._optionContainer.classList.add('option-container', 'option-element');
        this._optionContainerWrapper.appendChild(this._optionContainer);
        // option list: conatiners all possible options
        this._optionList = document.createElement('div');
        this._optionList.classList.add('option-list', 'option-element');
        this._optionContainer.appendChild(this._optionList);
        // option deatil: show details of an option
        this._optionDetail = document.createElement('div');
        this._optionDetail.classList.add('option-detail', 'option-element');
        this._optionContainer.appendChild(this._optionDetail);
    }
    // shows all possible options in option list
    async _showOptionListAndDetail(text) {
        this.searchID++;
        const thisSearch = this.searchID;
        this._setSizeAndPositionOfOCW(); // set size and position
        this._showOCW(true); // show option container wrapper
        this._pageNumberGenes = 0;
        this._moreGenes = false;
        this._clearOptionList();
        const loading = this._optionList.appendChild(getAnimatedLoadingText('attributes'));
        // await DebugTools.sleep(2000);
        try {
            const options = await this._getAllPossibleOptions(text);
            if (this.searchID === thisSearch) { // check if the retrieved options are still needed
                loading.remove(); // a follow up call to this method would have already removed the loading indicator and added a new one
                if (options.length > 0) {
                    this._createAllOptions(options);
                }
                else {
                    this._optionList.insertAdjacentHTML('afterbegin', `
            <p>No attributes were found with <i>${text}</i> in their name.<p>
          `);
                }
            }
        }
        catch {
            if (this.searchID === thisSearch) { // check if the retrieved options are still needed
                loading.remove();
                this._optionList.insertAdjacentHTML('afterbegin', `
          <p>Loading available attributes failed. Please check your connection and try again.<p>
        `);
            }
        }
    }
    async _getDatabaseColumns(database, view) {
        const viewDesc = await RestBaseUtils.getTDPDesc(database, view);
        this._databaseColumns = viewDesc.columns;
    }
    // create all options in option list
    _createAllOptions(data) {
        this._optionFocusIndex = -1;
        // get all selected-option-badges
        const badges = this._container.querySelectorAll(`.selected-option-badge`);
        const badgeIds = Array.from(badges).map((a) => {
            return a.dataset.optid;
        });
        // log.debug('current badges: ', badgeIds);
        // create the new options
        select(this._optionList)
            .selectAll('div')
            .data(data)
            .enter() // go through all groups
            .append('div')
            .attr('class', 'option-group option-element')
            .each((d, i, nodes) => {
            const group = select(nodes[i]);
            // add group header
            group.append('div')
                .attr('class', 'option-group-header option-element')
                .html(d.groupLabel);
            // go through all options for group
            this._addOptionsToGroup(group.node(), d);
        });
        // check if the load more option should be visible
        this._updateLoadMoreOption();
    }
    _sortDataColumns(a, b) {
        if (a.optionData.serverColumn.label < b.optionData.serverColumn.label) {
            return -1;
        }
        if (a.optionData.serverColumn.label > b.optionData.serverColumn.label) {
            return 1;
        }
        return 0;
    }
    _addOptionsToGroup(groupElement, options) {
        // get all selected-option-badges
        const badges = this._container.querySelectorAll(`.selected-option-badge`);
        const badgeIds = Array.from(badges).map((a) => {
            return a.dataset.optid;
        });
        select(groupElement)
            .selectAll('div.option').data(options.data, (d) => d.optionId)
            .enter()
            .append('div')
            .attr('class', 'option option-element')
            .attr('data-optid', (d) => d.optionId)
            .attr('data-subtypes', (d) => {
            // if optionType 0 = 'gene' the number of selected score as dataset.subtypes
            if (d.optionType === 'gene') {
                let noOfSub = 0;
                for (const bId of badgeIds) {
                    if (bId.indexOf(d.optionId.split(':')[0]) !== -1) {
                        noOfSub += 1;
                    }
                }
                return noOfSub;
            }
            else { // other wise set to null -> no dataset.subtypes will exits
                return null;
            }
        })
            .classed('option-selected', (d) => {
            // check if a option is selected (= badge), then add class to highlight
            let selected = false;
            for (const bId of badgeIds) {
                selected = selected || bId.split(':')[0] === d.optionId.split(':')[0];
            }
            return selected;
        })
            .html((d) => {
            let text = d.optionText;
            if (d.optionType === 'gene') {
                text = text + `<div class="option-text-ensemble option-element">${d.optionId}</div>`;
            }
            return text;
        })
            .on('click', (d, i, nodes) => {
            if (d.optionType !== 'gene') {
                // TODO #427 remove click handler for special attribtue 'treatment', replace with special attribtue constant
                if (d.optionId !== 'treatment') {
                    this._clickHandler(d, d.optionType, event, nodes[i]);
                    // indicate an change in the options
                    this._container.dispatchEvent(new CustomEvent('optionchange'));
                }
            }
        })
            .on('mouseover', (d, i, nodes) => {
            if (d.optionType === 'gene') {
                // set global optionId
                this._geneHoverOptionId = d.optionId;
                setTimeout(() => {
                    // update detail after timeout time global and current optionId is equal
                    if (d.optionId === this._geneHoverOptionId) {
                        this._mouseOverHandler(d, nodes[i]);
                    }
                }, 200);
            }
            else {
                this._mouseOverHandler(d, nodes[i]);
            }
        })
            .on('mouseout', (d, i, nodes) => {
            if (d.optionType === 'gene') {
                // clear global optionId
                this._geneHoverOptionId = null;
            }
        });
    }
    _updateLoadMoreOption() {
        select(this._optionList).selectAll('.load-option').remove();
        if (this._moreGenes) {
            select(this._optionList)
                .append('div')
                .attr('class', 'option-group-header option-element load-option')
                .html((d) => 'Loading more options ...');
        }
    }
    async _getAllPossibleOptions(text) {
        //check if databse column were loaded, otherwise do it now
        if (this._databaseColumns === null) {
            // get the database columns
            await this._getDatabaseColumns(this._databaseConfig.database, this._databaseConfig.view);
        }
        const optionGroups = [];
        // database columns
        const filteredData = this._databaseColumns.filter((a) => a.label.toLowerCase().indexOf(text.toLowerCase()) !== -1);
        const dataColumns = this._createSearchBarGroup(filteredData, 'Annotation Columns', 'dbc', 'label', 'column');
        log.debug('dataColumns: ', dataColumns);
        dataColumns.data.sort(this._sortDataColumns);
        // panel annotaion
        let panels = null;
        if (this._databaseConfig.view === 'tissue' || this._databaseConfig.view === 'cellline' || this._databaseConfig.view === 'gene') {
            if (this._panelAnnotations === null) {
                this._panelAnnotations = await this._getPanelAnnotation();
            }
            // log.debug('Panels: ', this._panelAnnotations);
            const groupPanelLabel = niceName(this._databaseConfig.view) + ' Panel Annotation';
            const filteredPanels = this._panelAnnotations.filter((a) => a.id.toLowerCase().indexOf(text.toLowerCase()) !== -1);
            panels = this._createSearchBarGroup(filteredPanels, groupPanelLabel, 'panel', 'id', 'id');
        }
        // gene score only for tissue and cellline
        let genes = null;
        if (this._databaseConfig.view === 'tissue' || this._databaseConfig.view === 'cellline') {
            // genes
            const genePage = await this._getGenePage(text, 0);
            this._moreGenes = genePage.more;
            genes = this._createSearchBarGroup(genePage.items, 'Genes', 'gene', 'text', 'id');
        }
        // log.debug('current options: ', { dataColumns, panels , genes });
        if (dataColumns && dataColumns.data.length > 0) {
            optionGroups.push(dataColumns);
        }
        if (panels && panels.data.length > 0) {
            optionGroups.push(panels);
        }
        if (genes && genes.data.length > 0) {
            optionGroups.push(genes);
        }
        return optionGroups;
    }
    _createSearchBarGroup(data, groupLabelText, type, textProperty, idProperty) {
        const group = {
            groupLabel: groupLabelText,
            data: data.map((a) => {
                const text = a[textProperty] === null ? '' : niceName(a[textProperty]);
                const oId = a[idProperty];
                return this._createOption(oId, type, text, a);
            })
        };
        return group;
    }
    _createOption(id, type, text, data) {
        const option = {
            optionId: id,
            optionType: type,
            optionText: text
        };
        switch (type) {
            case 'dbc':
                const spAttr = checkSpecialAttribute(option.optionId);
                if (spAttr) {
                    option.optionData = {
                        sAttrId: option.optionId,
                        attrOption: '',
                        spAttribute: spAttr,
                        serverColumn: data
                    };
                }
                else {
                    option.optionData = { serverColumn: data };
                }
                break;
            case 'gene':
                // Nothing to do here, added in clickHandler
                break;
            case 'panel':
                option.optionData = {
                    description: data.description,
                    species: data.species
                };
                break;
        }
        return option;
    }
    async _addAdditionalOptions(text) {
        this._pageNumberGenes += 1;
        const addOptions = await this._getAdditionalOptionsFromGenePage(text, this._pageNumberGenes);
        const optionGroupHeaders = this._optionList.querySelectorAll('.option-group-header');
        const targetGroups = Array.from(optionGroupHeaders).filter((a) => (a.innerHTML === addOptions.groupLabel));
        const targetGroup = targetGroups.length > 0 ? targetGroups[0].parentElement : null;
        log.debug('group to add: ', { targetGroup, addOptions });
        if (targetGroup !== null) {
            // add options to the group
            this._addOptionsToGroup(targetGroup, addOptions);
            // check if more option can be loaded
            this._updateLoadMoreOption();
        }
    }
    async _getAdditionalOptionsFromGenePage(query, page) {
        const genePage = await this._getGenePage(query, page);
        this._moreGenes = genePage.more;
        const genes = this._createSearchBarGroup(genePage.items, 'Genes', 'gene', 'text', 'id');
        return genes;
    }
    // get all available panels
    async _getPanelAnnotation() {
        const view = this._databaseConfig.view + '_panel';
        const panels = await RestBaseUtils.getTDPData(this._databaseConfig.database, view);
        return panels;
    }
    // get genes of a certain page with a query value
    _getGenePage(query, page) {
        return RestBaseUtils.getTDPLookup('publicdb', 'gene_gene_items', {
            column: 'symbol',
            species: 'human',
            query,
            page,
            limit: this._pageSize
        });
    }
    _clickHandler(currData, optionType, e, target) {
        // get option ID
        const optionId = target.dataset.optid;
        // get input elemenr
        const inputElement = this._container.getElementsByClassName('input-badge')[0];
        // array for the options, that should be managed
        const opt = {
            badgeName: currData.optionText,
            optionId: currData.optionId,
            data: currData
        };
        // create badge for the seach bar
        const sElem = this._createSearchBarBadge(opt.badgeName, opt.optionId);
        let existingSelectedItem = null; // item in search field
        // check if already selected
        if (this._container !== null) {
            // get all items from the search field with the defined optid
            const badges = this._container.querySelectorAll(`.selected-option-badge[data-optid="${opt.optionId}"]`);
            // go through all items
            if (badges.length === 1) {
                log.debug('selected badge: ', badges[0]);
                existingSelectedItem = badges[0];
            }
        }
        // set classes for un/selected options and (not) close option conatiern depending on the Ctrl-key
        if (target.classList.contains('option-selected')) { //already selected -> deselect
            log.debug('remove item: ', existingSelectedItem);
            if (e.ctrlKey || e.altKey) {
                target.classList.remove('option-selected');
                if (existingSelectedItem !== null) {
                    this._container.removeChild(existingSelectedItem);
                }
                this._setSizeAndPositionOfOCW();
                // this._searchBarInput.focus();
            }
            else {
                if (existingSelectedItem !== null) {
                    this._container.removeChild(existingSelectedItem);
                }
                this._showOCW(false); // close option container
            }
            this._addAndRemoveClearAll(); // add/remove the clearAll button
            this._setPlaceholder();
        }
        else { // not selected -> select
            log.debug('add item: ', sElem);
            if (e.ctrlKey || e.altKey) {
                target.classList.add('option-selected');
                this._container.insertBefore(sElem, inputElement);
                this._setSizeAndPositionOfOCW();
                // this._searchBarInput.focus();
            }
            else {
                this._container.insertBefore(sElem, inputElement);
                this._showOCW(false); // close option container
            }
            select(sElem).datum(opt.data);
            existingSelectedItem = sElem;
            this._addAndRemoveClearAll(); // add/remove the clearAll button
            this._setPlaceholder();
        }
    }
    _clickHandlerDetail(opttionData, bagdeData, badgeName, e, target) {
        // create data object for the badge
        // const dataForBadge = deepCopy(opttionData);
        // dataForBadge.optionData = {subType, type};
        const dataForBadge = bagdeData;
        // get option ID
        const optionId = target.dataset.optid;
        // get input elemenr
        const inputElement = this._container.getElementsByClassName('input-badge')[0];
        // create badge for the seach bar
        const sElem = this._createSearchBarBadge(badgeName, optionId);
        let existingSelectedItem = null; // item in search field
        // check if already selected
        if (this._container !== null) {
            // get all items from the search field with the defined optid
            const badges = this._container.querySelectorAll(`.selected-option-badge[data-optid="${optionId}"]`);
            // go through all items
            if (badges.length === 1) {
                log.debug('selected badge: ', badges[0]);
                existingSelectedItem = badges[0];
            }
        }
        const geneOption = this._optionList.querySelector(`.option[data-optid="${opttionData.optionId}"]`);
        const currNoOfSubTypes = Number(geneOption.dataset.subtypes);
        // set classes for un/selected options and (not) close option conatiern depending on the Ctrl-key
        if (target.classList.contains('option-selected')) { //already selected -> deselect
            log.debug('remove item: ', existingSelectedItem);
            if (e.ctrlKey || e.altKey) {
                target.classList.remove('option-selected');
                if (existingSelectedItem !== null) {
                    this._container.removeChild(existingSelectedItem);
                }
                this._setSizeAndPositionOfOCW();
                // this._searchBarInput.focus();
            }
            else {
                target.classList.remove('option-selected');
                if (existingSelectedItem !== null) {
                    this._container.removeChild(existingSelectedItem);
                }
                this._showOCW(false); // close option container
            }
            // remove gene hihglighting if no subdatatypes are selected
            geneOption.dataset.subtypes = '' + (currNoOfSubTypes - 1);
            if ((currNoOfSubTypes - 1) === 0) {
                geneOption.classList.remove('option-selected');
            }
            this._addAndRemoveClearAll(); // add/remove the clearAll button
            this._setPlaceholder();
        }
        else { // not selected -> select
            log.debug('add item: ', sElem);
            if (e.ctrlKey || e.altKey) {
                target.classList.add('option-selected');
                this._container.insertBefore(sElem, inputElement);
                this._setSizeAndPositionOfOCW();
                // this._searchBarInput.focus();
            }
            else {
                target.classList.add('option-selected');
                this._container.insertBefore(sElem, inputElement);
                this._showOCW(false); // close option container
            }
            // add gene hihglighting if one/more subdatatypes are selected
            geneOption.dataset.subtypes = '' + (currNoOfSubTypes + 1);
            if ((currNoOfSubTypes + 1) > 0) {
                geneOption.classList.add('option-selected');
            }
            select(sElem).datum(dataForBadge);
            existingSelectedItem = sElem;
            this._addAndRemoveClearAll(); // add/remove the clearAll button
            this._setPlaceholder();
        }
    }
    _mouseOverHandler(currData, node) {
        this._clearDetail();
        log.debug('mouse hover over attribute: ', currData);
        const detail = this._createDetail(currData, node);
        this._optionDetail.appendChild(detail);
    }
    _createSearchBarPlaceholder() {
        const elem = document.createElement('div');
        elem.className = 'search-bar-placeholder';
        elem.innerHTML = '<i class="fas fa-search"></i> Select one or multiple attributes';
        elem.style.width = '300px';
        this._searchBarPlaceholder = elem;
    }
    // create the selected items for the search field
    _createSearchBarBadge(badgeName, optionId) {
        const elem = document.createElement('div');
        elem.className = 'selected-option-badge';
        elem.dataset.optid = optionId;
        const label = document.createElement('div');
        label.className = 'label';
        label.innerHTML = badgeName;
        label.title = badgeName;
        const removeX = document.createElement('div');
        removeX.className = 'remove-x';
        removeX.innerHTML = '×';
        removeX.title = 'Remove';
        removeX.addEventListener('click', (e) => {
            e.stopPropagation();
            elem.parentNode.removeChild(elem);
            const optionTarget = this._optionList.querySelectorAll(`.option[data-optid="${optionId}"]`);
            Array.from(optionTarget).forEach((opt) => {
                opt.classList.remove('option-selected');
            });
            // options have change in search bar
            this._container.dispatchEvent(new CustomEvent('optionchange'));
            this._addAndRemoveClearAll();
            this._setPlaceholder();
        });
        elem.appendChild(removeX);
        elem.appendChild(label);
        return elem;
    }
    _addEventListeners() {
        // click into the serach bar sets the input text field as focus
        this._container.addEventListener('click', (e) => {
            e.stopPropagation();
            this._searchBarInput.focus();
        });
        // for the first click into the search box
        this._searchBarInput.addEventListener('focus', (e) => {
            this._showOptionListAndDetail(e.target.value);
        });
        // add list items for intput
        this._searchBarInput.addEventListener('input', (e) => {
            this._setSearchBarInputWidth();
            this._clearDetail();
            this._optionList.scrollTop = 0;
            this._showOptionListAndDetail(e.target.value);
        });
        // keyboard controls for the option list
        this._searchBarInput.addEventListener('keydown', (e) => {
            this._showOCW(true);
            this._keyboardControl(e);
        });
        // scroll for the pagination
        this._optionList.addEventListener('scroll', (e) => {
            this._scrollPagination(e);
        });
        // removes the eventlistener for the document
        document.removeEventListener('click', this._eventListenerCloseOptionWindow);
        // adds the eventlistener for the document
        document.addEventListener('click', this._eventListenerCloseOptionWindow);
    }
    _keyboardControl(e) {
        log.debug('keyboardControl: ', { key: e.key, focusIndex: this._optionFocusIndex });
        if (e.key === 'Down' || e.key === 'ArrowDown') {
            //arrow DOWN key
            this._optionFocusIndex++;
            this._setArrowKeyFocus();
        }
        else if (e.key === 'Up' || e.key === 'ArrowUp') {
            //arrow UP key
            this._optionFocusIndex--;
            this._setArrowKeyFocus();
        }
        else if (e.key === 'Enter') {
            // If the ENTER key is pressed, prevent the form from being submitted
            e.preventDefault();
            // const optList = document.getElementById('optionList');
            if (this._optionFocusIndex > -1) {
                const optionFocus = this._optionList.querySelector('.option.option-focus');
                if (optionFocus !== null) {
                    optionFocus.dispatchEvent(new MouseEvent('click', { ctrlKey: e.ctrlKey || e.altKey }));
                }
            }
        }
        else if (e.key === 'Esc' || e.key === 'Escape') {
            this._showOCW(false);
        }
    }
    // remove the option container wrapper, with css class
    _closeOCWCheck(element) {
        if (element !== null && !element.classList.contains('option-element') &&
            element !== this._optionList && element !== this._container &&
            element !== this._searchBarInput && element !== this._optionContainer &&
            element !== this._optionDetail) {
            this._showOCW(false);
        }
    }
    _setArrowKeyFocus() {
        const optListDim = this._optionList.getBoundingClientRect();
        // remove focus from old
        const optionFocus = this._optionList.querySelectorAll('.option.option-focus');
        if (optionFocus.length === 1) {
            optionFocus[0].classList.remove('option-focus');
        }
        // options
        const options = this._optionList.querySelectorAll('.option:not([hidden])');
        this._optionFocusIndex = this._optionFocusIndex >= options.length ? 0 : this._optionFocusIndex;
        this._optionFocusIndex = this._optionFocusIndex < 0 ? options.length - 1 : this._optionFocusIndex;
        log.debug('Arrow-Key action -> new index: ', { focusIndex: this._optionFocusIndex });
        // set focus
        options[this._optionFocusIndex].classList.add('option-focus');
        /*// generate detail information
        clearDetail();
        const currData = persons.filter((a) => a.name === options[optionFocusIndex].dataset.name); //not really elegant
        const detail = createDetail(currData[0]);
        optionDetail.appendChild(detail);*/
        // set scroll offset
        const optionDim = options[this._optionFocusIndex].getBoundingClientRect();
        const spaceBottom = 3 * optionDim.height;
        const spaceTop = 3 * optionDim.height;
        const listTop = optListDim.top;
        const currOptTop = optionDim.top;
        const listBot = optListDim.bottom;
        const currOptBottom = optionDim.bottom;
        const diffBot = listBot - currOptBottom;
        const diffTop = currOptTop - listTop;
        const currScrollTop = this._optionList.scrollTop;
        if (diffBot < spaceBottom) {
            this._optionList.scrollTop = currScrollTop + (spaceBottom - diffBot);
        }
        if (diffTop < spaceTop) {
            this._optionList.scrollTop = currScrollTop - (spaceTop - diffTop);
        }
    }
    async _scrollPagination(e) {
        if (this._moreGenes && !this._waitForMoreOptions) {
            const optListdim = this._optionList.getBoundingClientRect();
            const optdim = this._optionList.querySelector('.option') === null ? { height: 0 } : this._optionList.querySelector('.option').getBoundingClientRect();
            const optHeight = optdim.height;
            // log.debug('scroll now, event: ',e,optHeight);
            // log.debug('scrollTop: ', this._optionList.scrollTop, ' | scrollHeight: ',this._optionList.scrollHeight,'| optLIst height: ',optListdim.height);
            if (this._optionList.scrollTop + optListdim.height > this._optionList.scrollHeight - 3 * optHeight) {
                log.debug('Load now more options !');
                this._waitForMoreOptions = true;
                const text = this._searchBarInput.value;
                await this._addAdditionalOptions(text);
                this._waitForMoreOptions = false;
            }
        }
    }
    // show/hide the options for the search field
    _showOCW(show) {
        if (show) {
            this._optionContainerWrapper.removeAttribute('hidden');
        }
        else {
            this._setFocusAndScrollOfOptionList();
            this._clearDetail();
            this._clearOptionList();
            this._optionContainerWrapper.toggleAttribute('hidden', true);
            this._searchBarInput.value = '';
            this._setSearchBarInputWidth();
        }
    }
    _setFocusAndScrollOfOptionList() {
        this._optionFocusIndex = -1;
        if (this._optionList) {
            this._optionList.scrollTop = 0;
            const optionFocus = this._optionList.querySelectorAll('.option.option-focus');
            if (optionFocus.length === 1) {
                optionFocus[0].classList.remove('option-focus');
            }
        }
    }
    // set sie and position of the option continer wrapper
    _setSizeAndPositionOfOCW() {
        const containerDim = this._container.getBoundingClientRect();
        this._optionContainerWrapper.style.width = containerDim.width + 'px';
        this._optionContainerWrapper.style.left = containerDim.left + 'px';
        this._optionContainerWrapper.style.top = containerDim.bottom + 'px';
        // log.debug('dimensions: ', {searchBarContainer: containerDim, optionContainer: this._optionContainerWrapper.getBoundingClientRect()});
    }
    _setPlaceholder() {
        const inputTextLength = this._searchBarInput.value.length;
        const selectedOptionLength = this.getSelectedOptions().length;
        // get current placeholder element to use as check for later
        const existsPlaceholder = this._serachBarInputDiv.querySelector('.search-bar-placeholder') !== null;
        if (inputTextLength === 0 && selectedOptionLength === 0) {
            if (!existsPlaceholder) {
                this._serachBarInputDiv.appendChild(this._searchBarPlaceholder);
            }
        }
        else {
            if (existsPlaceholder) {
                this._serachBarInputDiv.removeChild(this._searchBarPlaceholder);
            }
        }
    }
    // set the width of the input element depending on text in it
    _setSearchBarInputWidth() {
        const textLength = this._searchBarInput.value.length;
        this._searchBarInput.style.width = (textLength + 2) + 'em';
        this._setPlaceholder();
    }
    // remove the detail info
    _clearDetail() {
        if (this._optionDetail) {
            while (this._optionDetail.firstChild) {
                this._optionDetail.removeChild(this._optionDetail.firstChild);
            }
        }
    }
    /**
     * Removes any options, loading indicators, or notes that no attributes  were found
     */
    _clearOptionList() {
        // options list
        const optionList = select(this._optionList);
        // remove the old options
        optionList.selectAll('*').remove();
    }
    // create the detail info for the input data
    _createDetail(data, parent) {
        let detail = document.createElement('div');
        if (data.optionType === 'dbc') {
            log.debug(`create detail for ${data.optionId}`);
            if (data.optionData && data.optionData.spAttribute) {
                detail = this._createSpecialDetail(data);
            }
            else {
                detail = this._createDBColumnDetail(data);
            }
        }
        else if (data.optionType === 'gene') {
            detail = this._createGeneDetail(data);
        }
        else if (data.optionType === 'panel') {
            detail = this._createPanelDetail(data);
        }
        detail.addEventListener('mouseenter', () => parent.style.backgroundColor = colors.searchbarHoverColor);
        detail.addEventListener('mouseleave', () => parent.style.backgroundColor = '');
        return detail;
    }
    _createGeneDetail(data) {
        const detail = document.createElement('div');
        detail.classList.add('detail-info', 'detail-gene', 'option-element');
        const badges = this._container.querySelectorAll(`.selected-option-badge`);
        const badgeIds = Array.from(badges).map((a) => {
            return a.dataset.optid;
        });
        const optionId = data.optionId;
        // label in detail container to see what gene is currently shown
        select(detail)
            .append('div')
            .attr('class', 'detail-info-gene-label option-element')
            .html(data.optionText)
            .append('span')
            .attr('class', 'detail-info-gene-ensemble option-element')
            .html(data.optionId);
        // options for gene
        select(detail)
            .selectAll('div.detail-info-group')
            .data(this._geneDataTypes)
            .enter() // go through all groups
            .append('div')
            .attr('class', 'detail-info-group option-element')
            .each((d, i, nodes) => {
            const group = select(nodes[i]);
            // add group header
            group.append('div')
                .attr('class', 'detail-info-group-header option-element')
                .html(d.name);
            // go through all options for group
            group.selectAll('div.detail-info-option').data(d.dataSubtypes)
                .enter()
                .append('div')
                .attr('class', 'detail-info-option option-element')
                .attr('data-optid', (d) => { return this._composeGeneDataTypeOptId(optionId, d.id); })
                .classed('option-selected', (d) => { return badgeIds.indexOf(this._composeGeneDataTypeOptId(optionId, d.id)) !== -1; })
                .html((d) => d.name)
                .on('click', (d, i, nodes) => {
                const badgeName = this._composeGeneDataTypeName(data.optionText, d.name);
                const badgeData = deepCopy(data);
                badgeData.optionData = { subType: d, type: d.dataTypeId };
                this._clickHandlerDetail(data, badgeData, badgeName, event, nodes[i]);
                // indicate an change in the options
                this._container.dispatchEvent(new CustomEvent('optionchange'));
            });
        });
        return detail;
    }
    _composeGeneDataTypeName(gene, dataType) {
        return gene + ': ' + dataType;
    }
    _composeGeneDataTypeOptId(geneId, dataTypeId) {
        return geneId + ':' + dataTypeId;
    }
    _createPanelDetail(option) {
        const detail = document.createElement('div');
        detail.classList.add('detail-info', 'detail-panel', 'option-element');
        const detailText = document.createElement('p');
        detailText.classList.add('option-element');
        detail.appendChild(detailText);
        detailText.innerHTML =
            '<span class="option-element">ID:</span> ' + option.optionId + '</br>' +
                '<span class="option-element">Description:</span> ' + option.optionData.description;
        return detail;
    }
    _createSpecialDetail(option) {
        log.debug('special detail data: ', option);
        const detail = document.createElement('div');
        detail.classList.add('detail-info', 'detail-special', 'option-element');
        // const treatment = SATreatment;
        const spAttr = option.optionData.spAttribute;
        log.debug('creating new detail for treatment');
        const badges = this._container.querySelectorAll(`.selected-option-badge`);
        const badgeIds = Array.from(badges).map((a) => {
            return a.dataset.optid;
        });
        const optionId = option.optionId;
        // label in detail container to see what gene is currently shown
        select(detail).append('div')
            .attr('class', 'detail-info-label option-element')
            .html(option.optionText);
        // text for the attribute
        select(detail).append('div')
            .attr('class', 'detail-info-text option-element')
            .html(`Treatment consists of a list of REGIMENs, each has one or multiple AGENTs`); // TODO #427 move into spAttribtue class
        select(detail).selectAll('div.detail-info-option').data(spAttr.options)
            .enter()
            .append('div')
            .attr('class', 'detail-info-option option-element')
            .attr('data-optid', (d) => d.id)
            .classed('option-selected', (d) => { return badgeIds.indexOf(d.id) !== -1; })
            .html((d) => d.name)
            .on('click', (d, i, nodes) => {
            const badgeName = `${option.optionText}:${d.name}`;
            const badgeData = deepCopy(option);
            badgeData.optionData = { sAttrId: option.optionId, attrOption: d.id, spAttribute: spAttr, serverColumn: option.optionData.serverColumn };
            this._clickHandlerDetail(option, badgeData, badgeName, event, nodes[i]);
            // this._clickHandlerDetail(data as IScoreOption, (d as any).dataTypeId, d, badgeName, event as MouseEvent, nodes[i] as HTMLElement);
            // indicate an change in the options
            log.debug('click spAttribute option: ', { oprtionId: option.optionId, badgeData });
            this._container.dispatchEvent(new CustomEvent('optionchange'));
        });
        return detail;
    }
    _createDBColumnDetail(option) {
        const detail = document.createElement('div');
        detail.classList.add('detail-info', 'detail-dbc', 'option-element');
        const detailText = document.createElement('p');
        detailText.classList.add('option-element');
        detail.appendChild(detailText);
        detailText.innerHTML =
            '<span class="option-element">Column:</span> ' + option.optionData.serverColumn.column + '</br>' +
                '<span class="option-element">Label:</span> ' + niceName(option.optionText) + '</br>' +
                '<span class="option-element">Type:</span> ' + option.optionType + '</br>' +
                '<span class="option-element">Text:</span> ' + option.optionText;
        return detail;
    }
    // remove all highlihgting of the highlighted options in the optionList
    _removeAllOptionHighlighting() {
        if (this._optionList) {
            const options = this._optionList.querySelectorAll('.option-selected');
            for (const opt of Array.from(options)) {
                opt.classList.remove('option-selected');
            }
        }
    }
    //remove the selected items in the search field
    _removeAllSelectedItems() {
        if (this._container) {
            const badges = this._container.querySelectorAll('.selected-option-badge');
            if (badges !== null) {
                for (const bdg of Array.from(badges)) {
                    this._container.removeChild(bdg);
                    this._removeAllOptionHighlighting();
                }
            }
            this._setPlaceholder();
        }
    }
    // add or remove the clear all button, if selected exist or not
    _addAndRemoveClearAll() {
        const badges = this._container.querySelectorAll('.selected-option-badge');
        //log.debug('items in searchBarContainer', items);
        if (badges.length > 0) {
            const clearAll = this._container.querySelectorAll('.clear-all');
            if (clearAll.length === 0) {
                const divClearAll = document.createElement('div');
                divClearAll.className = 'clear-all';
                divClearAll.title = 'Remove all';
                divClearAll.innerHTML = '<i class="fas fa-eraser  fa-fw fa-flip-horizontal" aria-hidden="true"></i>';
                divClearAll.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._removeAllSelectedItems();
                    // options have changed in search bar
                    this._container.dispatchEvent(new CustomEvent('optionchange'));
                    this._container.removeChild(divClearAll);
                });
                this._container.insertBefore(divClearAll, this._container.firstChild);
            }
        }
        else if (badges.length === 0) {
            const clearAll = this._container.querySelectorAll('.clear-all');
            if (clearAll.length === 1) {
                this._container.removeChild(clearAll[0]);
            }
        }
    }
    getSearchBarHTMLDivElement() {
        return this._container;
    }
    getSelectedOptions() {
        const badges = select(this._container).selectAll('.selected-option-badge');
        const badgesData = badges.data();
        return badgesData;
    }
    removeAllSelectedOptions() {
        this._removeAllSelectedItems();
        this._addAndRemoveClearAll();
        this._setPlaceholder();
    }
}
//# sourceMappingURL=SearchBar.js.map