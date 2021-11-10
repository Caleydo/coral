import { select } from 'd3-selection';
import * as $ from 'jquery';
import tippy from 'tippy.js';
import { toAttribute } from '../data/Attribute';
import searchHtml from '../templates/SearchColumn.html'; // webpack imports html to variable
import { log } from '../util';
import { SearchBar } from './SearchBar';
import { TASK_CLOSE_EVENT_TYPE } from './tasks/ATask';
import { TASKLIST } from './tasks/TaskList';
export default class SearchColumn {
    constructor($container, referenceCht, taskview) {
        this.referenceCht = referenceCht;
        this.taskview = taskview;
        this.taskCloseListener = (ev) => this.closeTask(ev.detail.task);
        $container.insertAdjacentHTML('beforeend', searchHtml); //faster than innerHTML (https://developer.mozilla.org/de/docs/Web/API/Element/insertAdjacentHTML)
        this.$searchColumn = $container.firstChild;
        this.$tasks = select(this.$searchColumn).select('.task-selector').node();
        this.$taskContainer = select(this.$searchColumn).select('.task-container').node();
        this.$ColumnHeader = select(this.$searchColumn).select('.header').node();
        $container.querySelectorAll('[title]').forEach((elem) => tippy(elem, {
            content(elm) {
                const title = elm.getAttribute('title');
                elm.removeAttribute('title');
                return title;
            },
        }));
        this.refCohort = referenceCht;
        this._setupSearchBar(referenceCht); // create the search bar and add the its options
        this.updateTaskButtonState();
        this.enableAddButtons(true);
        log.debug('Created search column');
    }
    clear() {
        select(this.$searchColumn).select('.task.selected').classed('selected', false); //deselect all others
        this.searchBar.removeAllSelectedOptions();
    }
    getSelectedAttributes() {
        const options = this.searchBar ? this.searchBar.getSelectedOptions() : [];
        return options.map((opt) => toAttribute(opt, this.refCohort.database, this.refCohort.view)); // TODO replace refCohort with some global config
    }
    destroy() {
        log.debug('Destroy');
        this.enableAddButtons(false);
        // this.searchBar.destroy(); // TODO if necessary
        this.$searchColumn.remove();
    }
    async _setupSearchBar(referenceCht) {
        this.searchBar = new SearchBar(select(this.$searchColumn).select('.search-bar').node(), referenceCht.database, referenceCht.view);
        this.setSearchBarVisibility(false); // hide searchBar -> set display: none
        this.searchBar.getSearchBarHTMLDivElement().addEventListener('optionchange', async (e) => {
            this.updateTasks();
        });
    }
    setSearchBarVisibility(show) {
        if (show) {
            this.searchBar.getSearchBarHTMLDivElement().removeAttribute('hidden');
        }
        else {
            this.searchBar.getSearchBarHTMLDivElement().toggleAttribute('hidden', true);
        }
    }
    updateTasks() {
        this.updateTaskButtonState();
        if (this.activeTask) {
            this.activeTask.show(this.$ColumnHeader, this.$taskContainer, this.getSelectedAttributes(), this.taskview.getInputCohorts());
        }
    }
    updateTaskButtonState() {
        const attributes = this.getSelectedAttributes();
        const cohorts = this.taskview.getInputCohorts();
        for (const task of TASKLIST) {
            const enable = task.supports(attributes, cohorts);
            const taskBtn = select(this.$tasks).select(`.${task.id}`).classed('disabled', !enable).datum(task);
            if (enable) {
                taskBtn.on('click', (t) => this.showTask(t));
            }
            else {
                taskBtn.on('click', null);
            }
        }
    }
    showTask(task) {
        this.$tasks.classList.add('minimize');
        this.activeTask = task;
        setTimeout(() => {
            this.$tasks.hidden = true;
            this.setSearchBarVisibility(task.showSearchBar()); // set visibility of searchBar based on the task
            task.show(this.$ColumnHeader, this.$taskContainer, this.getSelectedAttributes(), this.taskview.getInputCohorts());
        }, 200); // 200 = transform transition time in css
        this.taskview.showOutput(task.hasOutput);
        this.$ColumnHeader.addEventListener(TASK_CLOSE_EVENT_TYPE, this.taskCloseListener);
    }
    closeTask(task) {
        task.close();
        this.setSearchBarVisibility(false); // hide searchBar -> set display: none
        this.$tasks.hidden = false;
        this.activeTask = null;
        this.$tasks.classList.remove('minimize');
        this.taskview.showOutput(true);
        this.$ColumnHeader.removeEventListener(TASK_CLOSE_EVENT_TYPE, this.taskCloseListener);
    }
    enableAddButtons(enable) {
        if (enable) {
            // add eventListeners
            const that = this;
            select(this.$searchColumn).selectAll('div.action.add').on('click', function () {
                const button = this;
                const attributes = that.getSelectedAttributes();
                if (attributes.length > 0) {
                    for (const attr of attributes) {
                        if (button.classList.contains('add-left')) {
                            that.taskview.addAttributeColumnForInput(attr, true);
                        }
                        else {
                            that.taskview.addAttributeColumnForOutput(attr, true);
                        }
                    }
                }
                else {
                    button.classList.add('shaking');
                    setTimeout(() => button.classList.remove('shaking'), 500);
                    // @ts-ignore
                    $(button).popover('show');
                    // @ts-ignore
                    setTimeout(() => $(button).popover('hide'), 5000);
                }
            });
        }
        else {
            select(this.$searchColumn).selectAll('div.action.add').on('click', null); // remove addleft/addright
        }
    }
}
//# sourceMappingURL=SearchColumn.js.map