import { select } from 'd3-selection';
import { OnboardingManager } from '../../OnboardingManager';
export const TASK_CLOSE_EVENT_TYPE = 'task:close';
export class TaskCloseEvent extends CustomEvent {
    constructor(task) {
        super(TASK_CLOSE_EVENT_TYPE, { detail: { task }, bubbles: true });
    }
}
export class ATask {
    show(container, attributes, cohorts) {
        const task = this;
        select(container).selectAll('*').remove();
        this.$container = container;
        this.node = select(container).append('div').classed(this.id, true).classed('task-vis-container', true);
        this.header = this.node
            .append('div')
            .classed('task-header', true);
        const title = this.header
            .append('button')
            .classed('task-title btn btn-default', true)
            .html(`
        <i class="fas fa-chevron-left" aria-hidden="true"></i>
        &ensp;
        ${this.label}`)
            .on('click', function () {
            const clickedBtn = this;
            clickedBtn.dispatchEvent(new TaskCloseEvent(task));
        });
        OnboardingManager.addTip(this.id, title.node());
        this.body = this.node.append('div').classed('task-body', true);
    }
    close() {
        this.node.remove();
    }
}
//# sourceMappingURL=ATask.js.map