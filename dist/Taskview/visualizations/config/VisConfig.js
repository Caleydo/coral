/**
 * A Single option
 */
export class Option {
    constructor(label, selected = false) {
        this.label = label;
        this.selected = selected;
    }
}
/**
 * An option group. Only one option per group may be selected
 */
export class OptionGroup {
    /**
     * @param icon font awesome icon class
     * @param label
     * @param options
     */
    constructor(icon, label, options) {
        this.icon = icon;
        this.label = label;
        this.options = options;
        for (const o of options) {
            o.group = this;
        }
    }
    select(option) {
        for (const o of this.options) {
            o.selected = false;
        }
        option.selected = true;
    }
    getSelected() {
        return this.options.find((o) => o.selected);
    }
}
/**
 * VisConfig will be shown in header, can contain multiple groups
 */
export class VisConfig {
    /**
     * @param icon html code for the icon, e.g., for font-awesome: <i class="fas fa-sliders-h"></i>
     * @param label
     * @param groups
     */
    constructor(icon, label, groups) {
        this.icon = icon;
        this.label = label;
        this.groups = groups;
    }
}
//# sourceMappingURL=VisConfig.js.map