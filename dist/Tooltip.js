import tippy from 'tippy.js';
import { taskview } from './cohortview';
import { toAttribute } from './data/Attribute';
import { SearchBar } from './Taskview/SearchBar';
export function createSearchBarTooltip(elemWithTooltip, cssClassName, database, view, positionStart = true) {
    // start of tooltip content
    const divAddAttr = document.createElement('div');
    divAddAttr.classList.add('tooltip-serachbar');
    const divText = document.createElement('div');
    divText.innerHTML = 'Add attribute columns to the input and output sides:';
    divText.classList.add('tooltip-txt');
    divAddAttr.appendChild(divText);
    const divSearchBar = document.createElement('div');
    const searchBar = new SearchBar(divSearchBar, database, view, cssClassName);
    divAddAttr.appendChild(divSearchBar);
    const divControls = document.createElement('div');
    const divOK = document.createElement('div');
    divOK.classList.add('okay', 'btn', 'btn-coral', 'tooltip-btn');
    divOK.innerHTML = 'Okay';
    divOK.addEventListener('click', () => {
        // get options from search bar
        const options = searchBar ? searchBar.getSelectedOptions() : [];
        // convert options to attributes
        const attributes = options.map((opt) => toAttribute(opt, database, view));
        // add attributes to taskview
        taskview.addMultipleAttributeColumns(attributes, true, true);
        // remove options and close tooltip
        elemWithTooltip.click();
    });
    divControls.classList.add('tooltip-controls');
    const divCancel = document.createElement('div');
    divCancel.classList.add('cancel', 'btn', 'btn-coral', 'tooltip-btn');
    divCancel.innerHTML = 'Cancel';
    divCancel.addEventListener('click', () => {
        // remove options and close tooltip
        elemWithTooltip.click();
    });
    divControls.appendChild(divOK);
    divControls.appendChild(divCancel);
    divAddAttr.appendChild(divControls);
    elemWithTooltip.addEventListener('click', () => {
        searchBar.removeAllSelectedOptions(); // remove all selected options form the search bar
        elemWithTooltip.classList.toggle('active');
    });
    // add the tippy tool tip
    tippy(elemWithTooltip, {
        content: divAddAttr,
        allowHTML: true,
        interactive: true,
        placement: positionStart ? 'top-start' : 'top-end',
        appendTo: () => document.body,
        trigger: 'click',
        hideOnClick: 'toggle',
        arrow: true,
        zIndex: 9000,
        maxWidth: 'none', // default max. width is 350px
    });
}
//# sourceMappingURL=Tooltip.js.map