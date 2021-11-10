/**
 * A Single option
 */
export declare class Option {
    label: string;
    selected: boolean;
    group: OptionGroup;
    constructor(label: string, selected?: boolean);
}
/**
 * An option group. Only one option per group may be selected
 */
export declare class OptionGroup {
    icon: string;
    label: string;
    options: Option[];
    /**
     * @param icon font awesome icon class
     * @param label
     * @param options
     */
    constructor(icon: string, label: string, options: Option[]);
    select(option: Option): void;
    getSelected(): Option;
}
/**
 * VisConfig will be shown in header, can contain multiple groups
 */
export declare class VisConfig {
    icon: string;
    label: string;
    groups: OptionGroup[];
    /**
     * @param icon html code for the icon, e.g., for font-awesome: <i class="fas fa-sliders-h"></i>
     * @param label
     * @param groups
     */
    constructor(icon: string, label: string, groups: OptionGroup[]);
}
