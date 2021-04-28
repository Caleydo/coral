import d3 from 'd3';
import tippy from 'tippy.js';
import { log } from './util';
import { CohortRemoveEvent, CohortSelectionEvent } from './utilCustomEvents';
import { labelFromFilter } from './utilLabels';
export class RectCohortRep {
    constructor(cohort, height, width) {
        this.cohort = cohort;
        this.id = cohort.id;
        this.labelOne = cohort.labelOne;
        this.labelTwo = cohort.labelTwo;
        this._cohort = cohort;
        this._isSelected = false;
        this._height = height;
        this._width = width;
        this._representation = this._create(height, width);
        this._repClone = this._createClone(this._representation);
        this.setLabel(cohort.labelOne, cohort.labelTwo);
    }
    getRepresentation() {
        return this._representation;
    }
    _create(height, width) {
        const container = document.createElement('div');
        container.className = 'rectCohort';
        container.id = this.id;
        const labelHeight = 16;
        const barHeight = labelHeight;
        const fontSize = labelHeight < 15 ? labelHeight - 1 : 14;
        // -----------------------------
        // *--- create size bar div ---*
        const divSizeBar = document.createElement('div');
        divSizeBar.className = 'rectCohort-sizeBar cht-part';
        divSizeBar.style.height = barHeight + 'px';
        // indicator div for the size in the size bar div
        const divSizeBarIndicator = document.createElement('div');
        divSizeBarIndicator.className = 'rectCohort-sizeBar-indicator cht-part';
        divSizeBarIndicator.style.width = '0px';
        // add div for the size
        const divSizeBarLabel = document.createElement('div');
        divSizeBarLabel.className = 'size-label cht-part';
        divSizeBarLabel.style.height = labelHeight + 'px';
        divSizeBarLabel.style.lineHeight = labelHeight + 'px';
        divSizeBarLabel.style.fontSize = fontSize + 'px';
        // add div for the size overlay wrapper
        const divSizeBarLabelOverlayWrapper = document.createElement('div');
        divSizeBarLabelOverlayWrapper.className = 'size-label-overlay-wrapper cht-part';
        // add div for the size overlay
        const divSizeBarLabelOverlay = document.createElement('div');
        divSizeBarLabelOverlay.className = 'size-label-overlay cht-part';
        divSizeBarLabelOverlay.style.height = labelHeight + 'px';
        divSizeBarLabelOverlay.style.lineHeight = labelHeight + 'px';
        divSizeBarLabelOverlay.style.fontSize = fontSize + 'px';
        divSizeBarLabelOverlayWrapper.appendChild(divSizeBarLabelOverlay);
        divSizeBar.appendChild(divSizeBarLabel);
        divSizeBar.appendChild(divSizeBarIndicator);
        divSizeBar.appendChild(divSizeBarLabelOverlayWrapper);
        // ------------------------------
        // *--- create 1st row label ---*
        const divLabelBar = document.createElement('div');
        divLabelBar.style.height = labelHeight + 'px';
        divLabelBar.style.position = 'relative';
        // label
        const divLabel = document.createElement('div');
        divLabel.className = 'rectCohort-label-first rectCohort-label cht-part';
        divLabel.style.height = labelHeight + 'px';
        divLabel.style.lineHeight = labelHeight + 'px';
        divLabel.style.fontSize = fontSize + 'px';
        // remove button
        const divRemove = document.createElement('div');
        divRemove.classList.add('rectCohort-divRem', 'hidden');
        divRemove.title = 'Remove Cohort';
        divRemove.style.height = labelHeight + 'px';
        divRemove.style.width = labelHeight + 'px';
        divRemove.style.fontSize = fontSize + 'px';
        divRemove.style.position = 'absolute';
        divRemove.style.top = '0';
        divRemove.style.right = '0';
        this._removeButton = document.createElement('a');
        this._removeButton.classList.add('remove');
        this._removeButton.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';
        divRemove.appendChild(this._removeButton);
        divLabelBar.appendChild(divLabel);
        divLabelBar.appendChild(divRemove);
        // ------------------------------
        // *--- create 2nd row label ---*
        const divLabelTwo = document.createElement('div');
        divLabelTwo.className = 'rectCohort-label-second rectCohort-label cht-part';
        divLabelTwo.style.height = labelHeight + 'px';
        divLabelTwo.style.lineHeight = labelHeight + 'px';
        divLabelTwo.style.fontSize = fontSize + 'px';
        // --------------------------------------------
        // *--- add the 3 parts into the container ---*
        container.appendChild(divLabelBar);
        container.appendChild(divLabelTwo);
        container.appendChild(divSizeBar);
        // **** Add EventListeners ************************
        // show remove icon on hover
        container.addEventListener('mouseenter', (event) => {
            event.stopPropagation();
            // remove icon (=trash can)
            const allowDel = this._cohort.children.length === 0;
            const isRoot = this._cohort.isInitial;
            const isPreview = this._representation.classList.contains('preview');
            // onyl if it is not a preview
            if (!isPreview) {
                // only leaf nodes (not including root)
                if (!isRoot && allowDel) {
                    divRemove.classList.remove('hidden');
                }
                // make sure the paths are set
                this._getPathsForBloodline();
                // cohort backtracking (highlight the elements)
                this.addHighlightingToElements(this._bloodline);
                this.addHighlightingToPaths(this._bloodlinePaths);
            }
        });
        container.addEventListener('mouseleave', (event) => {
            event.stopPropagation();
            // remove trash can icon
            divRemove.classList.add('hidden');
            // make sure the paths are set
            this._getPathsForBloodline();
            // cohort backtracking (remove highlight from the elements)
            this.removeHighlightingFromElements(this._bloodline);
            this.removeHighlightingToPaths(this._bloodlinePaths);
        });
        let dbClickTimer;
        container.addEventListener('click', (event) => {
            if (event.detail === 1) { // single click
                dbClickTimer = setTimeout(() => {
                    log.debug('click on cohort');
                    if (event.target === this._removeButton.childNodes[0]) {
                        container.dispatchEvent(new CohortRemoveEvent(this.cohort));
                        event.stopPropagation();
                    }
                    else {
                        container.dispatchEvent(new CohortSelectionEvent(this.cohort));
                    }
                }, 300);
            }
            else if (event.detail === 2) {
                clearTimeout(dbClickTimer);
                log.debug('double-click on cohort');
                container.dispatchEvent(new CohortSelectionEvent(this.cohort, true));
            }
        });
        return container;
    }
    // adds the highlighting class to the overview graph elements
    addHighlightingToElements(elements) {
        for (const elem of elements) {
            elem.obj.representation.getRepresentation().classList.add('overview-element-highlight');
        }
    }
    // removes the highlighting class from the overview graph elements
    removeHighlightingFromElements(elements) {
        for (const elem of elements) {
            elem.obj.representation.getRepresentation().classList.remove('overview-element-highlight');
        }
    }
    // adds the highlighting class to the overview graph elements
    addHighlightingToPaths(paths) {
        for (const p of paths) {
            p.classList.add('overview-path-highlight');
            // no z-index for svg,  order depends on the order in the parent
            const parent = p.parentElement;
            // add path as the last child -> ingenious approach ;)
            parent.appendChild(p); // appendChild add element as the last, if it exist already it autom. removes it
        }
    }
    // removes the highlighting class from the overview graph elements
    removeHighlightingToPaths(paths) {
        for (const p of paths) {
            p.classList.remove('overview-path-highlight');
        }
    }
    // needed when a cohort is deleted
    removeBacktrackingHighlighting() {
        this.removeHighlightingFromElements(this._bloodline);
        this.removeHighlightingToPaths(this._bloodlinePaths);
    }
    _createClone(original) {
        const clone = original.cloneNode(true);
        const remDiv = clone.querySelector('.rectCohort-divRem');
        remDiv.parentNode.removeChild(remDiv);
        clone.id = 'clone_' + this.id;
        clone.style.setProperty('grid-area', null);
        // enable interactions for the cohorts in the task view (de/select input cohorts, de/select possible output cohorts)
        clone.addEventListener('click', (event) => {
            log.info('click on cohort');
            // to achieve toggle selection the ctrlClick variable has to be set to true
            const ctrlClick = true; // was CTRL or ALT key: (event as MouseEvent).ctrlKey || (event as MouseEvent).altKey;
            clone.dispatchEvent(new CohortSelectionEvent(this.cohort, !ctrlClick));
        });
        return clone;
    }
    getClone() {
        return this._repClone;
    }
    setSelection(state) {
        this._isSelected = state;
        this._representation.classList.toggle('selected', state);
        this._repClone.classList.toggle('selected', state);
        this.assignColor(state);
    }
    assignColor(state) {
        const color = this._cohort.colorTaskView;
        if (state) {
            // background color
            this._representation.style.backgroundColor = color;
            this._repClone.style.backgroundColor = color;
            // font color = white if color is too dark
            if (color !== null && color !== 'transparent' && d3.hsl(color).l < 0.6) { //transparent has lightness of zero
                this._representation.style.color = 'white';
                this._repClone.style.color = 'white';
                this._removeButton.style.color = 'white';
            }
        }
        else {
            // remove object css properties
            // background color
            this._representation.style.backgroundColor = null;
            this._repClone.style.backgroundColor = null;
            // font color
            this._representation.style.color = null;
            this._repClone.style.color = null;
            this._removeButton.style.color = null;
        }
    }
    getSelection() {
        return this._isSelected;
    }
    setInformation(labelOne, labelTwo, size, sizeReference) {
        this.setLabel(labelOne, labelTwo);
        this.setSize(size, sizeReference);
    }
    setLabel(labelOne, labelTwo = '') {
        // 1st row
        // original
        const divLabel = this._representation.querySelector('div.rectCohort-label-first');
        if (divLabel) {
            divLabel.innerHTML = labelOne;
        }
        // clone
        const divLabelClone = this._repClone.querySelector('div.rectCohort-label-first');
        if (divLabelClone) {
            divLabelClone.innerHTML = labelOne;
        }
        // 2nd row
        // original
        const divLabeTwol = this._representation.querySelector('div.rectCohort-label-second');
        if (divLabeTwol) {
            divLabeTwol.innerHTML = labelTwo;
        }
        // clone
        const divLabelCloneTwo = this._repClone.querySelector('div.rectCohort-label-second');
        if (divLabelCloneTwo) {
            divLabelCloneTwo.innerHTML = labelTwo;
        }
    }
    setSize(size, sizeReference) {
        // calculate the size of bar and set its color accordingly
        const percentage = (size / sizeReference) * 100;
        //original
        const sizeBarPercentage = this._representation.querySelector('div.rectCohort-sizeBar-indicator');
        sizeBarPercentage.style.width = `${percentage}%`;
        // set the label for the size
        // this._representation.querySelector('div.rectCohort-labelBar').innerHTML = '' + size;
        this._representation.querySelector('div.size-label').innerHTML = '' + size;
        // get overlay and overlayWrapper
        const overlay = this._representation.querySelector('div.size-label-overlay');
        const overlayWrapper = this._representation.querySelector('div.size-label-overlay-wrapper');
        // ser width of overlayWrapper with 100%
        overlayWrapper.style.width = `100%`;
        // now get the calculated with of overlayWrapper (is a string with 'px' at the end)
        const repSize = window.getComputedStyle(overlayWrapper).getPropertyValue('width').slice(0, -2);
        overlay.innerHTML = '' + size; // set the text for the size
        overlay.style.width = repSize + 'px'; // set size for the overlay
        overlayWrapper.style.width = `${percentage}%`; // set size of the wrapper to the length of the bar
        // clone
        const sizeBarPercentageClone = this._repClone.querySelector('div.rectCohort-sizeBar-indicator');
        sizeBarPercentageClone.style.width = `${percentage}%`;
        // set the label for the size
        // this._repClone.querySelector('div.rectCohort-labelBar').innerHTML = '' + size;
        this._repClone.querySelector('div.size-label').innerHTML = '' + size;
        // get overlay and overlayWrapper
        const overlayClone = this._repClone.querySelector('div.size-label-overlay');
        const overlayWrapperClone = this._repClone.querySelector('div.size-label-overlay-wrapper');
        // ser width of overlayWrapper with 100%
        overlayWrapperClone.style.width = `100%`;
        // now get the calculated with of overlayWrapper (is a string with 'px' at the end)
        const repSizeClone = window.getComputedStyle(overlayWrapperClone).getPropertyValue('width').slice(0, -2);
        overlayClone.innerHTML = '' + size; // set the text for the size
        overlayClone.style.width = repSizeClone + 'px'; // set size for the overlay
        overlayWrapperClone.style.width = `${percentage}%`; // set size of the wrapper to the length of the bar
        // create summary for the cohort
        this._setSummary();
    }
    _setSummary() {
        // create summary
        this._bloodline = this._cohort.getBloodline();
        // TODO labels
        // const summary = this._formatHoverSummary();
        // this._representation.title = summary;
        // this._repClone.title = summary;
        const summaryHTML = this._formatHoverSummary();
        const prevInstRep = this._representation._tippy;
        if (prevInstRep) {
            prevInstRep.setContent(summaryHTML);
        }
        else {
            tippy(this._representation, {
                content: summaryHTML,
                allowHTML: true,
                placement: 'bottom-start',
            });
        }
        const summaryHTMLCopy = summaryHTML.cloneNode(true);
        const prevInstClone = this._repClone._tippy;
        if (prevInstClone) {
            prevInstClone.setContent(summaryHTMLCopy);
        }
        else {
            tippy(this._repClone, {
                content: summaryHTMLCopy,
                allowHTML: true,
                placement: 'bottom-start',
            });
        }
    }
    _getPathsForBloodline() {
        // has to be done every time, due to the change of the svg paths order
        this._bloodlinePaths = [];
        // get all paths
        const svgContainer = document.getElementById('svg-path-container');
        // check if bloodline is defined
        if (this._bloodline) {
            // go through all task elements in the bloodline
            for (const elem of this._bloodline) {
                const pathsElemIn = Array.from(svgContainer.querySelectorAll(`.path-ep-in-${elem.obj.id}`));
                this._bloodlinePaths.push(...pathsElemIn);
            }
        }
        else {
            // update bloodline
            this._setSummary();
        }
    }
    // TODO labels
    // private _formatHoverSummary(): string {
    _formatHoverSummary() {
        // heritage summaries
        const htmlLte = /&#8804/g;
        const htmlLt = /&#60/g;
        const htmlGte = /&#8805/g;
        const htmlGt = /&#62/g;
        let summaries = '';
        const maxSize = this._bloodline[this._bloodline.length - 1].size;
        let previousSize = maxSize;
        let cntStep = 1;
        let htmlTooltip;
        const tooltipInfo = [];
        if (this._bloodline.length > 1) { // only if more than 1 element (root)
            for (let i = this._bloodline.length - 2; i > 0; i = i - 2) {
                const ttInfo = { chtName: '', chtSize: 0, prevSize: 0, percentage: 0, attr: [] };
                const task = this._bloodline[i];
                const cohort = this._bloodline[i - 1];
                // TODO labels
                // const valueLabel = cohort.obj.labelTwo.replace(htmlLte,'<=').replace(htmlLt,'<');
                const cohortObj = cohort.obj;
                ttInfo.chtName = cohortObj.label;
                ttInfo.chtSize = cohort.size;
                ttInfo.prevSize = previousSize;
                // TODO labels change the tooltip to show detailed value ranges
                const cohortValues = cohortObj.values;
                // split task label into attribute labels
                const attrLabel = task.label.split(', ');
                log.debug('cohortValues: ', cohortValues);
                const detailedLabelArray = [];
                const labels = cohortObj.labelOne.split(', ');
                for (let i = 0; i < cohortValues.length; i++) {
                    const val = cohortValues[i];
                    const label = labels[i];
                    let labelpart = '';
                    if (Array.isArray(val)) {
                        labelpart = val.map((a) => labelFromFilter(a, label)).join(' / ');
                    }
                    else {
                        labelpart = labelFromFilter(val, label);
                    }
                    detailedLabelArray.push(labelpart);
                    ttInfo.attr.push({ name: attrLabel[i], value: labelpart });
                }
                const detailedLabel = detailedLabelArray.join(', ');
                const valueLabel = detailedLabel.replace(htmlLte, '<=').replace(htmlLt, '<').replace(htmlGte, '>=').replace(htmlGt, '>');
                const percentage = Math.round(cohort.size / maxSize * 100000) / 1000;
                ttInfo.percentage = percentage;
                tooltipInfo.push(ttInfo);
                // TODO lables
                // summaries = summaries + `\n${cntStep}: ${task.label} = ${valueLabel}:\n    ${previousSize} -> ${cohort.size} (= ${percentage} % of the entire dataset)`;
                summaries = summaries + `\n${cntStep}. ${task.label}: ${valueLabel}:\n    ${previousSize} -> ${cohort.size} (= ${percentage} % of the entire dataset)`;
                previousSize = cohort.size;
                cntStep += 1;
            }
            htmlTooltip = this.createCohortTooltip(false, tooltipInfo);
        }
        else {
            const cohort = this._bloodline[0];
            const ttInfo = { chtName: '', chtSize: 0, prevSize: 0, percentage: 0, attr: [] };
            const cohortObj = cohort.obj;
            ttInfo.chtName = cohortObj.label;
            ttInfo.chtSize = cohort.size;
            ttInfo.prevSize = previousSize;
            tooltipInfo.push(ttInfo);
            htmlTooltip = this.createCohortTooltip(true, tooltipInfo);
        }
        // TODO labels
        // label + summaries
        // return `${this.labelOne}\n${this.labelTwo.replace(htmlLte, '<=').replace(htmlLt, '<')}` + summaries;
        return htmlTooltip;
    }
    createCohortTooltip(root, ttInfo) {
        // TODO labels
        log.debug('toolTipInfo: ', ttInfo);
        log.debug('tooltip cohort: ', this._cohort);
        // container with tooltip
        const ctrTooltip = document.createElement('div');
        // cohort with tooltip
        if (ttInfo.length > 0) {
            // container for cohort inforamtion
            const ctrCohort = document.createElement('div');
            ctrTooltip.appendChild(ctrCohort);
            // cohort info
            // name
            const currChtInfo = ttInfo[ttInfo.length - 1];
            const chtName = document.createElement('div');
            chtName.innerHTML = currChtInfo.chtName;
            chtName.style.fontWeight = 'bold';
            // values
            const chtValues = document.createElement('div');
            for (const a of currChtInfo.attr) {
                const currAttr = document.createElement('div');
                currAttr.innerHTML = `${a.name}: ${a.value}`;
                currAttr.style.paddingLeft = '15px';
                chtValues.appendChild(currAttr);
            }
            ctrCohort.appendChild(chtName);
            ctrCohort.appendChild(chtValues);
            if (!root) {
                // provenance
                // label for provenance
                const provLabel = document.createElement('div');
                provLabel.innerHTML = 'Provenance';
                provLabel.style.fontWeight = 'bold';
                provLabel.style.marginTop = '5px';
                ctrTooltip.appendChild(provLabel);
                // container for cohort provenance
                const ctrProvenace = document.createElement('div');
                ctrTooltip.appendChild(ctrProvenace);
                let chtStep = 1;
                // go through all ttInfos
                // for (let i = ttInfo.length - 1; i >= 0; i--) {
                for (const currChtInfo of ttInfo) {
                    const ctrCurrCht = document.createElement('div');
                    // const currChtInfo = ttInfo[i];
                    const chtLabel = document.createElement('div');
                    // chtLabel.style.position = 'relative';
                    const chtNr = document.createElement('span');
                    chtNr.innerHTML = `${chtStep}. `;
                    chtStep += 1;
                    // chtNr.style.minWidth = '15px';
                    // chtNr.style.width = '15px !important';
                    // chtNr.style.maxWidth = '15px';
                    // chtNr.style.position = 'absolute';
                    // chtNr.style.left = '0px';
                    // chtNr.style.top = '0px';
                    chtNr.style.fontWeight = 'bold';
                    const chtName = document.createElement('span');
                    chtName.innerHTML = currChtInfo.chtName;
                    // chtName.style.position = 'absolute';
                    // chtName.style.left = '15px';
                    // chtName.style.top = '0px';
                    chtLabel.appendChild(chtNr);
                    chtLabel.appendChild(chtName);
                    // size
                    const chtSize = document.createElement('div');
                    chtSize.innerHTML = `Size: ${currChtInfo.chtSize} (= ${currChtInfo.percentage}% of the dataset)`;
                    chtSize.style.paddingLeft = '15px';
                    // size diff
                    const chtSizeDiff = document.createElement('div');
                    const sizeDiff = currChtInfo.prevSize - currChtInfo.chtSize;
                    chtSizeDiff.innerHTML = `Size differnece to previous: ${sizeDiff}`;
                    chtSizeDiff.style.paddingLeft = '15px';
                    // values
                    const chtValues = document.createElement('div');
                    for (const a of currChtInfo.attr) {
                        const currAttr = document.createElement('div');
                        currAttr.innerHTML = `${a.name}: ${a.value}`;
                        currAttr.style.paddingLeft = '15px';
                        chtValues.appendChild(currAttr);
                    }
                    ctrCurrCht.appendChild(chtLabel);
                    ctrCurrCht.appendChild(chtValues);
                    ctrCurrCht.appendChild(chtSize);
                    // ctrCurrCht.appendChild(chtSizeDiff);
                    ctrTooltip.appendChild(ctrCurrCht);
                }
            }
        }
        // const prevInstRep = (this._representation as any)._tippy;
        // if (prevInstRep) {
        //   prevInstRep.setContent(ctrTooltip);
        // } else {
        //   tippy(this._representation, {
        //     content: ctrTooltip,
        //     allowHTML: true,
        //     placement: 'bottom-start',
        //   });
        // }
        // const ctrTooltipCopy = ctrTooltip.cloneNode(true) as HTMLDivElement;
        // const prevInstClone = (this._repClone as any)._tippy;
        // if (prevInstClone) {
        //   prevInstClone.setContent(ctrTooltip);
        // } else {
        //   tippy(this._repClone, {
        //     content: ctrTooltipCopy,
        //     allowHTML: true,
        //     placement: 'bottom-start',
        //   });
        // }
        // // add the tippy tool tip
        // tippy(elemWithTooltip, {
        //   content: ctrTooltip,
        //   allowHTML: true,
        //   //interactive: true, // tooltip is interactive: clickable/hoverable content
        //   placement: 'bottom-start',
        //   // placement: positionStart ? 'top-start' : 'top-end',
        //   //appendTo: () => document.body, // add the content to the document as a child
        //   //trigger: 'click', // element has to be clicked to show the tooltip
        //   //hideOnClick: 'toggle', // the tooltip is closed when the element is clicked again
        //   // arrow: true, // show tooltip arrow
        //   //zIndex: 9000, // default z-index: 9999 (but the searchbar option container has z-index of 9001)
        //   //maxWidth: 'none',  // default max. width is 350px
        // });
        return ctrTooltip;
    }
}
//# sourceMappingURL=CohortRepresentations.js.map