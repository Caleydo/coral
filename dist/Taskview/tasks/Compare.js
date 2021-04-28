/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */
import * as d3 from 'd3';
import { select } from 'd3-selection';
import { MethodManager, SCOPE, Type, WorkerManager } from 'tourdino';
import { ATask } from './ATask';
import { log } from '../../util';
export class Compare extends ATask {
    constructor() {
        super(...arguments);
        this.label = `Compare`;
        this.id = `compare`;
        this.hasOutput = false;
    }
    supports(attributes, cohorts) {
        return cohorts.length > 0;
    }
    showSearchBar() {
        return true;
    }
    async show(container, attributes, cohorts) {
        super.show(container, attributes, cohorts);
        this.attributes = attributes;
        this.cohorts = cohorts;
        this.body.classed('tourdino', true);
        this.appendTable();
        this.updateTable();
        this.body.append('div').classed('details', true);
        this.appendLegend();
    }
    appendTable() {
        const tableContainer = this.body.append('div').classed('table-container', true).html(`
    <table>
      <thead>
        <tr>
          <th class="head-desc">
            <header>Difference of Cohorts</header>
            <p>(☞ﾟヮﾟ)☞</p>
          </th>
          <th></th>
        </tr>
      </thead>
    </table>
    `);
    }
    updateTableDescription(isTableEmpty) {
        if (isTableEmpty) {
            const text = 'Please use the search field above to specify the attributes by which the cohorts are to be compared.';
            this.body.select('.table-container table .head-desc').style('width', null).select('p').text(text);
        }
        else {
            const text = 'Click a value in the table for details.';
            this.body.select('.table-container table .head-desc').style('width', '13em').select('p').text(text);
        }
    }
    updateTable() {
        WorkerManager.terminateAll(); // Abort all calculations as their results are no longer needed
        const timestamp = new Date().getTime().toString();
        this.body.attr('data-timestamp', timestamp);
        const colHeadsCht = this.body.select('thead tr').selectAll('th.head').data(this.cohorts, (cht) => cht.id);
        const colHeadsChtSpan = colHeadsCht.enter().append('th')
            .attr('class', 'head rotate').append('div').append('span').append('span'); //th.head are the column headers
        const that = this; // for the function below
        const updateTableBody = (bodyData, timestamp) => {
            if (that.body.attr('data-timestamp') !== timestamp) {
                return; // skip outdated result
            }
            that.updateTableDescription(bodyData.length === 0);
            // create a table body for every column
            const bodies = that.body.select('table').selectAll('tbody').data(bodyData, (d) => d[0][0].label); // the data of each body is of type: Array<Array<IScoreCell>>
            const bodiesEnter = bodies.enter().append('tbody').classed('bottom-margin', true); //For each IColumnTableData, create a tbody
            // the data of each row is of type: Array<IScoreCell>
            const trs = bodies.merge(bodiesEnter).selectAll('tr').data((d) => d, (d) => d[0].key); // had to specify the function to derive the data (d -> d)
            const trsEnter = trs.enter().append('tr');
            const tds = trs.merge(trsEnter).selectAll('td').data((d) => d); // the data of each td is of type: IScoreCell
            const tdsEnter = tds.enter().append('td');
            // Set colheads in thead
            colHeadsChtSpan.html((d) => `${d.label}`);
            colHeadsChtSpan.each(function (d) {
                const parent = select(this).node().parentNode; //parent span-element
                select(parent).style('background-color', (d) => d.colorTaskView);
                let color = '#333333';
                if (d && d.colorTaskView && 'transparent' !== d.colorTaskView && d3.hsl(d.colorTaskView).l < 0.5) { //transparent has lightness of zero
                    color = 'white';
                }
                select(parent.parentNode).style('color', color)
                    .attr('title', (d) => `${d.label}`);
            });
            // set data in tbody
            tds.merge(tdsEnter)
                .attr('colspan', (d) => d.colspan)
                .attr('rowspan', (d) => d.rowspan)
                .style('color', (d) => d.foreground)
                .style('background-color', (d) => d.background)
                .attr('data-type', (d) => d.type)
                .classed('action', (d) => d.score !== undefined)
                .classed('score', (d) => d.measure !== undefined)
                .html((d) => d.label)
                .on('click', function () { that.onClick.bind(that)(this); })
                .on('mouseover', function () { that.onMouseOver.bind(that)(this, true); })
                .on('mouseout', function () { that.onMouseOver.bind(that)(this, false); })
                .attr('title', function () { return that.createToolTip.bind(that)(this); });
            // Exit
            tds.exit().remove(); // remove cells of removed columns
            colHeadsCht.exit().remove(); // remove attribute columns
            trs.exit().remove(); // remove attribute rows
            bodies.exit().remove();
            colHeadsCht.order();
            trs.order(); // Order the trs is important, if you have no items selected and then do select some, the select category would be at the bottom and the unselect category at the top of the table
            bodies.order();
            const svgWidth = 120 + 33 * this.cohorts.length; // 120 height with 45° widht also 120, calculated width for the svg and polygon
            that.body.select('th.head.rotate svg').remove();
            that.body.select('th.head.rotate') //select first
                .insert('svg', ':first-child')
                .attr('width', svgWidth)
                .attr('height', 120)
                .append('polygon').attr('points', '0,0 ' + svgWidth + ',0 0,120'); // 120 is thead height
        };
        this.getTableBody(this.cohorts, this.attributes, true, null).then((data) => updateTableBody(data, timestamp)); // initialize
        this.getTableBody(this.cohorts, this.attributes, false, (data) => updateTableBody(data, timestamp)).then((data) => updateTableBody(data, timestamp)); // set values
    }
    appendLegend() {
        const legendContainer = this.body.append('div').classed('legend', true);
        insertLegend(legendContainer);
    }
    close() {
        super.close();
    }
    /**
     *     For each attribute in rowAttributes, we want to comapre the rows inside colGroups with the rows of rowGroups
     *     i.e. the number of table rows is: |rowAttributes| * |rowGroups|
     *     and there are |colGroups| columns
     *     + plus the rows and columns where we put labels
     *
     * @param colGroups
     * @param rowGroups
     * @param rowAttributes
     * @param scaffold only create the matrix with row headers, but no value calculation
     * @param update
     */
    async getTableBody(cohorts, attributes, scaffold, update) {
        const data = this.prepareDataArray(cohorts, attributes);
        if (scaffold) {
            return data;
        }
        else {
            const promises = [];
            // if a group is part of the column and row item groups, we use these array to get the correct index (so we can avoid duplicate calculations)
            const rowIndex4col = cohorts.map((colGrp, i) => i);
            for (const [bodyIndex, attr] of attributes.entries()) {
                const attrPromises = [];
                const measures = MethodManager.getMeasuresByType(Type.get(attr.type), Type.get(attr.type), SCOPE.SETS); // Always compare selected elements with a group of elements of the same column
                if (measures.length > 0) {
                    const measure = measures[0];
                    for (const [rowIndex, rowCht] of cohorts.entries()) {
                        // Get the data of 'attr' for the rows inside 'rowCht'
                        const rowData = (await attr.getData(rowCht.dbId)).map((item) => item[attr.dataKey]);
                        for (const [colIndex, colCht] of cohorts.entries()) {
                            const colIndexOffset = rowIndex === 0 ? 2 : 1; // Two columns if the attribute label is in the same line, (otherwise 1 (because rowspan))
                            if (rowCht.id === colCht.id) { // identical groups
                                data[bodyIndex][rowIndex][colIndexOffset + colIndex] = { label: '<span class="circle"/>', measure };
                            }
                            else if (rowIndex4col[rowIndex] >= 0 && rowIndex4col[colIndex] >= 0 && rowIndex4col[colIndex] < rowIndex) {
                                // the cht is also part of the colGroups array, and the colGrp is one of the previous rowGroups --> i.e. already calculated in a table row above the current one
                            }
                            else {
                                const colData = (await attr.getData(colCht.dbId)).map((item) => item[attr.dataKey]);
                                const setParameters = {
                                    setA: rowData,
                                    setADesc: attr,
                                    setACategory: { label: `${rowCht.label}`, color: rowCht.colorTaskView },
                                    setB: colData,
                                    setBDesc: attr,
                                    setBCategory: { label: `${colCht.label}`, color: colCht.colorTaskView }
                                };
                                attrPromises.push(new Promise((resolve, reject) => {
                                    // score for the measure
                                    let score = null;
                                    score = measure.calc(rowData, colData, null);
                                    // return score;
                                    resolve(score);
                                }).then((score) => {
                                    data[bodyIndex][rowIndex][colIndexOffset + colIndex] = this.toScoreCell(score, measure, setParameters);
                                    if (rowIndex4col[rowIndex] >= 0 && rowIndex4col[colIndex] >= 0) {
                                        const colIndexOffset4Duplicate = rowIndex4col[colIndex] === 0 ? 2 : 1; // Currenlty, we can't have duplicates in the first line, so this will always be 1
                                        data[bodyIndex][rowIndex4col[colIndex]][colIndexOffset4Duplicate + rowIndex4col[rowIndex]] = this.toScoreCell(score, measure, setParameters);
                                    }
                                }).catch((err) => {
                                    log.error(err);
                                    const errorCell = { label: 'err', measure };
                                    data[bodyIndex][rowIndex][colIndexOffset + colIndex] = errorCell;
                                    if (rowIndex4col[rowIndex] >= 0 && rowIndex4col[colIndex] >= 0) {
                                        const colIndexOffset4Duplicate = rowIndex4col[colIndex] === 0 ? 2 : 1;
                                        data[bodyIndex][rowIndex4col[colIndex]][colIndexOffset4Duplicate + rowIndex4col[rowIndex]] = errorCell;
                                    }
                                }));
                            }
                        }
                    }
                }
                Promise.all(attrPromises).then(() => { update(data); }); // TODO: updateSelectionAndVisuallization
                promises.concat(attrPromises);
            }
            await Promise.all(promises); //rather await all at once: https://developers.google.com/web/fundamentals/primers/async-functions#careful_avoid_going_too_sequential
            return data; // then return the data
        }
    }
    prepareDataArray(cohorts, attributes) {
        if (cohorts.length === 0 || attributes.length === 0) {
            return []; //return empty array, will cause an empty table
        }
        const data = new Array(attributes.length); // one array per attribute (number of table bodies)
        for (const [i, attr] of attributes.entries()) {
            data[i] = new Array(cohorts.length); // one array per rowGroup (number of rows in body)
            for (const [j, cht] of cohorts.entries()) {
                data[i][j] = new Array(cohorts.length + (j === 0 ? 2 : 1)).fill({ label: '<i class="fas fa-circle-notch fa-spin"></i>', measure: null });
                data[i][j][j === 0 ? 1 : 0] = {
                    label: `${cht.label}`,
                    background: cht.colorTaskView,
                    foreground: textColor4Background(cht.colorTaskView)
                };
                if (j === 0) {
                    data[i][j][0] = {
                        label: `<b>${attr.label}</b>`,
                        rowspan: cohorts.length,
                        type: attr.type
                    };
                }
                data[i][j][0].key = `${attr.label}-${cht.id}`;
            }
        }
        return data;
    }
    toScoreCell(score, measure, setParameters) {
        let color = score2color(score.pValue);
        let cellLabel = score.pValue.toFixed(3);
        cellLabel = cellLabel.startsWith('0') ? cellLabel.substring(1) : score.pValue.toFixed(2); // [0,1) --> .123, 1 --> 1.00
        if (score.pValue > 0.1) {
            color = {
                background: '#ffffff',
                foreground: '#ffffff',
            };
        }
        if (score.pValue === -1) {
            cellLabel = '-';
            color = {
                background: '#ffffff',
                foreground: '#ffffff',
            };
        }
        return {
            label: cellLabel,
            background: color.background,
            foreground: color.foreground,
            score,
            measure,
            setParameters
        };
    }
    createToolTip(tableCell) {
        if (select(tableCell).classed('score') && select(tableCell).classed('action')) {
            const tr = tableCell.parentNode; //current row
            const tbody = tr.parentNode; //current body
            const table = tbody.parentNode; //current table
            const allTds = select(tr).selectAll('td');
            let index = -1;
            const currLength = allTds.nodes().length;
            // get current index of cell in row
            allTds.nodes().forEach((tdNode, i) => {
                if (tdNode === tableCell) {
                    index = i;
                }
            });
            // all label cells in row
            const rowCategories = [];
            select(tr).selectAll('td:not(.score)').each(function () {
                rowCategories.push(select(this).text());
            });
            // the first cell in the first row of the cells tbody
            const row = select(tbody).select('tr').select('td').text();
            // maxIndex is the maximum number of table cell in the table
            const maxLength = select(tbody).select('tr').selectAll('td').nodes().length;
            // if currMaxIndex and maxIndex are not the same -> increase headerIndex by one
            // because the current row has one cell fewer
            const headerIndex = (currLength === maxLength) ? index : index + 1;
            // column label
            const allHeads = select(table).select('thead').selectAll('th');
            const header = select(allHeads.nodes()[headerIndex]).select('div').select('span').text();
            const category = rowCategories.pop();
            const isColTask = category === row ? true : false;
            const cellData = select(tableCell).datum();
            const scoreValue = typeof (cellData.score.scoreValue) === 'number' && !isNaN(cellData.score.scoreValue) ? cellData.score.scoreValue.toFixed(3) : 'n/a';
            let scorePvalue = cellData.score.pValue;
            if (scorePvalue === -1) {
                scorePvalue = 'n/a';
            }
            else {
                scorePvalue = scorePvalue.toExponential(3);
            }
            let tooltipText = '';
            if (isColTask) {
                tooltipText = `Column: ${header}\nRow: ${row}\nScore: ${scoreValue}\np-Value: ${scorePvalue}`;
            }
            else {
                tooltipText = `Data Column: ${row}\nColumn: ${header}\nRow: ${category}\nScore: ${scoreValue}\np-Value: ${scorePvalue}`;
            }
            return tooltipText;
        }
        else {
            // cell that have no p-values
            return null;
        }
    }
    onClick(tableCell) {
        const cellData = select(tableCell).datum();
        log.debug('Cell click - data: ', cellData);
        // save data for selected cell in sesisonStorage
        let selCellObj;
        // save selected cell in sessionStorage
        if (cellData.measure !== null && cellData.score) {
            const colLabel = this.body.selectAll('span.cross-selection').text();
            const rowLabels = [];
            this.body.selectAll('td.cross-selection').each(function (d) {
                const label = select(this).text();
                const rowspan = select(this).attr('rowspan');
                const obj = { label, rowspan };
                rowLabels.push(obj);
            });
            // create selected cell object
            selCellObj = { colLabel, rowLabels };
        }
        else {
            selCellObj = { colLabel: null, rowLabels: null };
        }
        log.debug('selectionLabels: ', selCellObj);
        const selCellObjString = JSON.stringify(selCellObj);
        sessionStorage.setItem('touringSelCell', selCellObjString);
        this.highlightSelectedCell(tableCell, cellData);
        this.visualizeSelectedCell(tableCell, cellData);
    }
    onMouseOver(tableCell, state) {
        if (select(tableCell).classed('score')) {
            const tr = tableCell.parentNode; //current row
            const tbody = tr.parentNode; //current body
            const table = tbody.parentNode; //current table
            const allTds = select(tr).selectAll('td');
            let index = -1;
            const currLength = allTds.nodes().length;
            // get current index of cell in row
            allTds.nodes().forEach((tdNode, i) => {
                if (tdNode === tableCell) {
                    index = i;
                }
            });
            // highlight all label cells in row
            select(tr).selectAll('td:not(.score)').classed('cross-selection', state);
            // highlight the first cell in the first row of the cells tbody
            select(tbody).select('tr').select('td').classed('cross-selection', state);
            // maxIndex is the maximum number of table cell in the table
            const maxLength = select(tbody).select('tr').selectAll('td').nodes().length;
            // if currMaxIndex and maxIndex are not the same -> increase headerIndex by one
            // because the current row has one cell fewer
            const headerIndex = (currLength === maxLength) ? index : index + 1;
            // highlight column label
            const allHeads = select(table).select('thead').selectAll('th');
            if (index > -1) {
                // use header index
                select(allHeads.nodes()[headerIndex]).select('div').select('span').classed('cross-selection', state);
            }
        }
    }
    highlightSelectedCell(tableCell, cellData) {
        // remove bg highlighting from all tds
        this.body.selectAll('td').classed('selectedCell', false);
        if (cellData.score) { //Currenlty only cells with a score are calculated (no category or attribute label cells)
            // Color table cell
            select(tableCell).classed('selectedCell', true); // add bg highlighting
        }
    }
    visualizeSelectedCell(tableCell, cellData) {
        // remove all old details
        const details = this.body.select('div.details');
        details.selectAll('*').remove(); // avada kedavra outdated details!
        if (cellData.score) { //Currenlty only cells with a score are calculated (no category or attribute label cells)
            const resultScore = cellData.score;
            const measure = cellData.measure;
            // Display details
            if (measure) {
                this.generateVisualDetails(details, measure, resultScore, cellData.setParameters); //generate description into details div
            }
            else {
                details.append('p').text('There are no details for the selected table cell.');
            }
            // display visualisation
            if (measure.visualization) {
                const visualization = measure.visualization;
                if (cellData.setParameters) {
                    const d3v3Details = d3.select(details.node());
                    visualization.generateVisualization(d3v3Details, cellData.setParameters, cellData.score);
                }
            }
        }
    }
    // generates the detail inforamtion to the test and the remove button
    generateVisualDetails(miniVisualisation, measure, measureResult, setParameters) {
        const divDetailInfoContainer = miniVisualisation.append('div')
            .classed('detailVisContainer', true);
        //button for mini visualization removal
        const that = this;
        const detailRemoveButton = divDetailInfoContainer.append('button');
        detailRemoveButton.attr('class', 'btn btn-default removeMiniVis-btn');
        detailRemoveButton.on('click', function () { that.removeCellDetails.bind(that)(miniVisualisation); });
        detailRemoveButton.html('x');
        const divDetailInfo = divDetailInfoContainer.append('div')
            .classed('detailVis', true);
        // the 2 compared sets
        const setALabel = setParameters.setACategory ? setParameters.setACategory.label : setParameters.setADesc.label;
        const setBLabel = setParameters.setBCategory ? setParameters.setBCategory.label : setParameters.setBDesc.label;
        const detailSetInfo = divDetailInfo.append('div')
            .classed('detailDiv', true);
        if (setParameters.setACategory) {
            detailSetInfo.append('span')
                .classed('detail-label', true)
                .text('Data Column: ')
                .append('span')
                .text(setParameters.setADesc.label);
            detailSetInfo.append('span')
                .text(' / ');
        }
        detailSetInfo.append('span')
            .classed('detail-label', true)
            .text('Comparing ');
        detailSetInfo.append('span')
            .html(setALabel + ' ')
            .append('span')
            .text('[' + measureResult.setSizeA + ']');
        detailSetInfo.append('span')
            .classed('detail-label', true)
            .text(' vs. ');
        detailSetInfo.append('span')
            .html(setBLabel + ' ')
            .append('span')
            .text('[' + measureResult.setSizeB + ']');
        // test value + p-value
        const scoreValue = typeof (measureResult.scoreValue) === 'number' && !isNaN(measureResult.scoreValue) ? measureResult.scoreValue.toFixed(3) : 'n/a';
        const pValue = measureResult.pValue === -1 ? 'n/a' : measureResult.pValue.toExponential(3);
        const detailInfoValues = divDetailInfo.append('div')
            .classed('detailDiv', true);
        // .text(`Test-Value: ${scoreValue}, p-Value: ${pValue}`);
        detailInfoValues.append('span')
            .classed('detail-label', true)
            .text(measure.label + ': ');
        detailInfoValues.append('span')
            .text(scoreValue);
        detailInfoValues.append('span')
            .text(', ');
        detailInfoValues.append('span')
            .classed('detail-label', true)
            .text('p-Value: ');
        detailInfoValues.append('span')
            .text(pValue);
        // test description
        divDetailInfo.append('div')
            .classed('detailDiv', true)
            .text('Description: ')
            .append('span')
            .text(measure.description);
    }
    // removes mini visualization with details, and highlighting
    removeCellDetails(details) {
        // remove bg highlighting from all tds
        this.body.selectAll('div.table-container').selectAll('td').classed('selectedCell', false);
        // remove saved selection from session storage
        const selCellObj = { task: this.id, colLabel: null, rowLabels: null };
        log.debug('selectionLabels: ', selCellObj);
        const selCellObjString = JSON.stringify(selCellObj);
        sessionStorage.setItem('touringSelCell', selCellObjString);
        // remove mini visualization with details
        details.selectAll('*').remove();
    }
}
// creates legend for the p-value; copied from tdp_core:
// https://github.com/datavisyn/tdp_core/blob/keckelt/122/touring/src/lineup/internal/Touring/Tasks/Tasks.ts#L242
const insertLegend = (parentElement) => {
    const divLegend = parentElement.append('div').classed('measure-legend', true);
    const svgLegendContainer = divLegend.append('svg')
        .attr('width', '100%')
        .attr('height', 50);
    // .attr('viewBox','0 0 100% 35')
    // .attr('preserveAspectRatio','xMaxYMin meet');
    const legendId = Date.now();
    const svgDefs = svgLegendContainer.append('defs').append('linearGradient')
        .attr('id', 'pValue-gradLegend-' + legendId);
    svgDefs.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#000000');
    svgDefs.append('stop')
        .attr('offset', '25%')
        .attr('stop-color', '#FFFFFF');
    let xStart = 0;
    const yStart = 0;
    const barWidth = 300;
    const barHeight = 10;
    const space = 5;
    const textHeight = 15;
    const textWidth = 50;
    const tickLength = 5;
    const lineWidth = 1;
    xStart = xStart + textWidth;
    const svgLegend = svgLegendContainer.append('g');
    const svgLegendLabel = svgLegend.append('g');
    // label
    svgLegendLabel.append('text')
        .attr('x', xStart)
        .attr('y', yStart + barHeight)
        .attr('text-anchor', 'end')
        .text('p-Value');
    xStart = xStart + space;
    const svgLegendGroup = svgLegend.append('g');
    // bar + bottom line
    svgLegendGroup.append('rect')
        .attr('x', xStart).attr('y', yStart)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .style('fill', 'url(#pValue-gradLegend-' + legendId + ')');
    svgLegendGroup.append('line')
        .attr('x1', xStart).attr('y1', yStart + barHeight)
        .attr('x2', xStart + barWidth).attr('y2', yStart + barHeight)
        .style('stroke-width', lineWidth).style('stroke', 'black');
    // label: 0 + tick
    svgLegendGroup.append('text')
        .attr('x', xStart).attr('y', yStart + barHeight + textHeight)
        .attr('text-anchor', 'middle').text('0');
    svgLegendGroup.append('line')
        .attr('x1', xStart).attr('y1', yStart)
        .attr('x2', xStart).attr('y2', yStart + barHeight - (lineWidth / 2) + tickLength)
        .style('stroke-width', lineWidth / 2).style('stroke', 'black');
    // label: 0.05 + tick
    svgLegendGroup.append('text')
        .attr('x', xStart + (barWidth * 0.25)).attr('y', yStart + barHeight + textHeight)
        .attr('text-anchor', 'middle').text('0.05');
    svgLegendGroup.append('line')
        .attr('x1', xStart + (barWidth * 0.25)).attr('y1', yStart + barHeight - (lineWidth / 2))
        .attr('x2', xStart + (barWidth * 0.25)).attr('y2', yStart + barHeight - (lineWidth / 2) + tickLength)
        .style('stroke-width', lineWidth / 2).style('stroke', 'black');
    // label: 0.05 + tick
    svgLegendGroup.append('text')
        .attr('x', xStart + (barWidth * 0.5)).attr('y', yStart + barHeight + textHeight)
        .attr('text-anchor', 'middle').text('0.1');
    svgLegendGroup.append('line')
        .attr('x1', xStart + (barWidth * 0.5)).attr('y1', yStart + barHeight - (lineWidth / 2))
        .attr('x2', xStart + (barWidth * 0.5)).attr('y2', yStart + barHeight - (lineWidth / 2) + tickLength)
        .style('stroke-width', lineWidth / 2).style('stroke', 'black');
    // label: 0.5 + tick
    svgLegendGroup.append('text')
        .attr('x', xStart + (barWidth * 0.75)).attr('y', yStart + barHeight + textHeight)
        .attr('text-anchor', 'middle').text('0.5');
    svgLegendGroup.append('line')
        .attr('x1', xStart + (barWidth * 0.75)).attr('y1', yStart + barHeight - (lineWidth / 2))
        .attr('x2', xStart + (barWidth * 0.75)).attr('y2', yStart + barHeight - (lineWidth / 2) + tickLength)
        .style('stroke-width', lineWidth / 2).style('stroke', 'black');
    // label: 1 + tick
    svgLegendGroup.append('text')
        .attr('x', xStart + barWidth).attr('y', yStart + barHeight + textHeight)
        .attr('text-anchor', 'middle').text('1');
    svgLegendGroup.append('line')
        .attr('x1', xStart + barWidth).attr('y1', yStart)
        .attr('x2', xStart + barWidth).attr('y2', yStart + barHeight - (lineWidth / 2) + tickLength)
        .style('stroke-width', lineWidth / 2).style('stroke', 'black');
    // label: no p-value correction
    svgLegendLabel.append('text')
        .attr('x', xStart)
        .attr('y', yStart + barHeight + 2 * textHeight)
        .attr('text-anchor', 'start')
        .text('No p-Value correction for multiple comparisons.');
};
export function textColor4Background(backgroundColor) {
    let color = '#333333';
    if ('transparent' !== backgroundColor && d3.hsl(backgroundColor).l < 0.5) { //transparent has lightness of zero
        color = 'white';
    }
    return color;
}
export function score2color(score) {
    let background = '#ffffff'; //white
    let foreground = '#333333'; //kinda black
    if (score <= 0.05) {
        // log.debug('bg color cahnge')
        const calcColor = d3.scale.linear().domain([0, 0.05]).range(['#000000', '#FFFFFF']);
        background = calcColor(score).toString();
        foreground = textColor4Background(background);
    }
    return { background, foreground };
}
//# sourceMappingURL=Compare.js.map