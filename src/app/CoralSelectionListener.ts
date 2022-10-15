import { Cohort } from '../Cohort';
import { CoralApp } from './CoralApp';
import Taskview, { InputCohort } from '../Taskview/Taskview';
import { log, removeFromArray } from '../util';
import { CohortSelectionEvent, COHORT_SELECTION_EVENT_TYPE } from '../utilCustomEvents';

export class CohortSelectionListener {
  private static instance: CohortSelectionListener;

  public taskview: Taskview;

  selection: Cohort[] = [];

  firstCohort = true;

  public static get() {
    return CohortSelectionListener.instance;
  }

  static init(eventTarget: Node, app: CoralApp) {
    if (CohortSelectionListener.instance) {
      CohortSelectionListener.instance.eventTarget.removeEventListener(COHORT_SELECTION_EVENT_TYPE, CohortSelectionListener.instance.handleSelectionEvent); // remove listener
      CohortSelectionListener.instance.selection.forEach((cht) => (cht.selected = false)); // deselect
      delete CohortSelectionListener.instance; // destroy
    }
    CohortSelectionListener.instance = new CohortSelectionListener(eventTarget, app);
  }

  static reset() {
    if (CohortSelectionListener.instance) {
      CohortSelectionListener.instance.selection = [];
      CohortSelectionListener.instance.firstCohort = true;
    }
  }

  private constructor(private eventTarget: Node, private app: CoralApp) {
    eventTarget.addEventListener(COHORT_SELECTION_EVENT_TYPE, (ev) => this.handleSelectionEvent(ev as CohortSelectionEvent)); // arrow function to keep "this" working in eventhandler
  }

  public handleSelectionEvent(ev: CohortSelectionEvent) {
    const clickedCht = ev.detail.cohort;
    const { replaceSelection } = ev.detail;

    if (!clickedCht.representation.getRepresentation().classList.contains('preview')) {
      // if true deselect all current selected cohorts
      if (replaceSelection) {
        const toDeselect = this.selection.splice(0, this.selection.length); // clear array and get a copy with cohorts to deselect
        toDeselect.forEach((cht) => (cht.selected = false)); // deselect all
      }

      // Update selection array:
      if (this.selection.indexOf(clickedCht) > -1) {
        // already selected --> remove
        removeFromArray(this.selection, clickedCht);
        clickedCht.colorTaskView = null;
        clickedCht.selected = false;
        if ((clickedCht as InputCohort).outputCohorts !== undefined) {
          delete (clickedCht as InputCohort).outputCohorts;
        }
        log.info(`De-Selected "${clickedCht.label}"`);
      } else {
        if (this.firstCohort) {
          // this is the first cohort the user selected
          this.app.setAppGridLayout('split'); // show bottom
          this.firstCohort = false;
        }

        this.selection.push(clickedCht);
        clickedCht.colorTaskView = null;
        clickedCht.selected = true;
        log.info(`Selected "${clickedCht.label}"`);
      }

      //  set selection in taskview
      this.taskview.setInputCohorts(this.selection);

      this.selection.forEach((cht) => (cht.selected = true));
      this.taskview.clearOutput(); // every selection change clears the output cohorts
    }
  }
}
