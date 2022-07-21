import { select } from 'd3v7';
import { OnboardingManager } from '../../OnboardingManager';
export const TASK_CLOSE_EVENT_TYPE = 'task:close';
export class TaskCloseEvent extends CustomEvent {
    constructor(task) {
        super(TASK_CLOSE_EVENT_TYPE, { detail: { task }, bubbles: true });
    }
}
export class ATask {
    show(columnHeader, container, attributes, cohorts) {
        const task = this;
        select(container).selectAll('*').remove();
        select(columnHeader).selectAll('.task-title').remove();
        this.$container = container;
        this.$columnHeader = columnHeader;
        this.node = select(container).append('div').classed(this.id, true).classed('task-vis-container', true);
        // header element for visualization configs
        this.header = this.node
            .append('div')
            .classed('task-header', true);
        // create back title button
        const backTitle = document.createElement('button');
        columnHeader.prepend(backTitle);
        // add text, classes, and fucntion to back title button
        select(backTitle)
            .classed('task-title btn btn-coral', true)
            .html(`
        <i class="fas fa-chevron-left" aria-hidden="true"></i>
        &ensp;
        ${this.label}`)
            .on('click', function () {
            const clickedBtn = this;
            clickedBtn.dispatchEvent(new TaskCloseEvent(task));
        });
        OnboardingManager.addTip(this.id, backTitle);
        this.body = this.node.append('div').classed('task-body', true);
    }
    close() {
        select(this.$columnHeader).selectAll('.task-title').remove();
        this.node.remove();
    }
}
//# sourceMappingURL=ATask.js.map