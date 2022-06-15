import {ICohort, IElement, IOverviewLayout, IRectLayout, ITask} from '../CohortInterfaces';
import {Task} from '../Tasks';
import {deepCopy, log} from '../util';

export class RectangleLayout implements IOverviewLayout {
  private _layout: Array<any>;

  public cohortWidth: number;
  public pathWidth: number;
  public taskWidth: number;
  public rowHeight: number;

  constructor(cohortWidth: number = 150, pathWidth: number = 50, taskWidth: number = 50, rowHeight: number = 50) {
    this.cohortWidth = cohortWidth;
    this.pathWidth = pathWidth;
    this.taskWidth = taskWidth;
    this.rowHeight = rowHeight;
  }

  createLayout(root: ICohort): Array<any> {
    this._layout = [];
    this._layout = this._assignRowAndColumn([], root, null, 1, 1);
    this._assignSameRowForParentAndChild();
    return deepCopy(this._layout);
  }

  setContainerGrid(container: HTMLDivElement, columns: number, rows: number): void {
    // container.classed('layout_rect',true);
    container.classList.add('layout_rect');
    // get grid style columns and rows
    const gridStyleColumns = this._createGridStyleColumns(columns);
    const gridStyleRows = this._createGridStyleRows(rows);

    // calculate width
    const gridSizeString: string = gridStyleColumns.replace(/px/g, '');
    const gridSizeArray: Array<number> = gridSizeString.split(' ').map(Number);
    const width = gridSizeArray.reduce((a, b) => {return a + b;}, 0);
    // calcualte heigth
    const height = rows * this.rowHeight;

    // style container
    container.style.width = width + 'px';
    container.style.height = height + 'px';
    container.style.setProperty('grid-template-columns', gridStyleColumns);
    container.style.setProperty('grid-template-rows', gridStyleRows);
  }

  setPositionInGrid(element: HTMLDivElement, column: number, row: number) {
    element.style.setProperty('grid-column', '' + this._getGridColumn(column));
    element.style.setProperty('grid-row', '' + row);
  }

  private _createGridStyleColumns(columns: number): string {
    let style = '';
    for (let i = 1; i <= columns; i++) {
      if (i % 2 === 1) {
        style = style + this.cohortWidth + 'px ';
      } else {
        style = style + this.pathWidth + 'px ' + this.taskWidth + 'px ';
        if (i < columns) {
          style = style + this.pathWidth + 'px ';
        }
      }
    }
    return style;
  }

  private _createGridStyleRows(rows: number): string {
    let style = '';
    for (let i = 1; i <= rows; i++) {
      style = style + this.rowHeight + 'px ';
    }
    return style;
  }

  private _getGridColumn(column: number): number {
    return column === 1 ? column : column + (column - 1);
  }

  private _assignSameRowForParentAndChild() {
    // log.debug('current layout: ', this._layout);
    const maxColumn = Math.max(...this._layout.map((elem) => elem.column));

    for (let i = maxColumn; i > 1; i--) {
      const currMaxRow = 1;
      // get all elements of current column
      const currColElem = this._layout.filter((elem) => elem.column === i);
      // get all elements of previous column
      const prevColElem = this._layout.filter((elem) => elem.column === (i - 1));
      // get all the different parentIDs of current column
      let currParentIDs = currColElem.map((elem) => elem.parentID);
      currParentIDs = [...new Set(currParentIDs)];

      // log.debug('SameParent: ', {maxColumn, i, currParentIDs});
      // go though the parentIDs
      for (const pID of currParentIDs) {
        // select filter all elements with the current column and parentID
        const elemWithPID = currColElem.filter((elem) => elem.parentID === pID);
        // get the lowest row positon of these elements
        const minElemID = Math.min(...elemWithPID.map((elem) => elem.row));
        // set row position of the parent in previous column
        const currParents = prevColElem.filter((elem) => elem.elemID === pID);
        // log.debug('SameParent - Parent Info: ', {minElemID, pID, currParents});
        if (currParents.length > 0) {
          // only one parent possible
          const currParent = currParents[0];
          // get old row position
          const oldRowPos = currParent.row;

          // incerese all parent row positions higher the old row position
          // by the difference of the old and new position
          const rowDiff = minElemID - oldRowPos;
          const higherRowPosElems = prevColElem.filter((elem) => elem.row > oldRowPos);
          for (const hrElem of higherRowPosElems) {
            const newPos = hrElem.row + rowDiff;
            hrElem.row = newPos;
          }

          // set new row position
          currParent.row = minElemID;
          // log.debug('SameParent - Parent:', {minElemID, currParent});
        }
      }
    }
  }

  private _assignRowAndColumn(layout: IRectLayout[], currElement: IElement, parentElement: IElement, column: number, row: number): IRectLayout[] {
    if (currElement !== undefined && currElement !== null) {
      if (currElement.children && currElement.children.length > 0) {
        // current element has children
        const eleChildren = this._sortCohortElements(currElement.children);

        // get all row position from the next column (cohort or task)
        const nextColRow = layout.filter((elem) => elem.column === column + 1).map((elem) => elem.row);
        // calculate the row position of current element so that the child can be in the same row in the next column
        let calcRow = nextColRow.length === 0 ? 1 : Math.max(...nextColRow) + 1;
        // only if
        //   the current element is an operation and
        //   the calculate row position is higher than the current one use the calculated one
        calcRow = (currElement instanceof Task && calcRow > row) ? calcRow : row;

        // add current element to layout
        const parentElementID = parentElement === null ? 'null' : parentElement.id;
        layout.push(this._createLayoutElement(currElement.id, parentElementID, column, calcRow));

        for (let i = 0; i < eleChildren.length; i++) {
          // set column and row for the children
          const childrenColumn = column + 1;
          const childrenRow = calcRow + i;
          //const childfirstChild = i === 0;

          layout.concat(this._assignRowAndColumn(layout, eleChildren[i], currElement, childrenColumn, childrenRow));
        }

        return layout;
      } else {
        // current element has no children
        // add current element to layout
        const parentElementID = parentElement === null || parentElement === undefined ? 'null' : parentElement.id;
        layout.push(this._createLayoutElement(currElement.id, parentElementID, column, row));
        return layout;
      }
    } else {
      return [];
    }
  }

  private _createLayoutElement(elemID: string, parentID: string, column: number, row: number): IRectLayout {
    return {
      elemID,
      parentID,
      column,
      row
    };
  }

  private _sortCohortElements(elements: Array<IElement>): Array<IElement> {
    if (elements.length > 0) {
      if (elements[0] instanceof Task) {
        return elements.sort(this._sortTasks);
      } else {
        return elements;
        // return elements.sort(this._sortCohorts); // TODO make sort dependent on the sorting of the output cohort
      }
    }
    return elements;
  }

  private _sortTasks(a: ITask, b: ITask) {
    log.debug('sortTasks');
    // smaller than 0, sort 'a' with a lower index than 'b', i.e. 'a' before 'b'.
    // bigger than 0, sort 'b' with a lower index than 'a', i.e. 'b' before 'a'.
    // order of 'a' and 'b' stays the same.
    return a.creationDate - b.creationDate;
  }

  private _sortCohorts(a: ICohort, b: ICohort) {
    log.debug('sortCohorts');
    // smaller than 0, sort 'a' with a lower index than 'b', i.e. 'a' before 'b'.
    // bigger than 0, sort 'b' with a lower index than 'a', i.e. 'b' before 'a'.
    // order of 'a' and 'b' stays the same.
    if (a.label < b.label) {
      return -1;
    }
    if (a.label > b.label) {
      return 1;
    }
    return 0;
  }

}
