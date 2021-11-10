/**
 * A Single option
 */
export class Option {
  public group: OptionGroup;

  constructor(public label: string, public selected: boolean = false) { }
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
  constructor(public icon: string, public label: string, public options: Option[]) {
    for (const o of options) {
      o.group = this;
    }
  }

  public select(option: Option) {
    for (const o of this.options) {
      o.selected = false;
    }

    option.selected = true;
  }

  public getSelected() {
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
  constructor(public icon: string, public label: string, public groups: OptionGroup[]) { }
}
