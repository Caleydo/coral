import { Props, Instance as TippyInstance } from 'tippy.js';
export declare class OnboardingManager {
    static tooltips: Map<String, TippyInstance<Props>>;
    static init(settings?: any): void;
    static addTip(tipId: string, elem: HTMLElement, forceShow?: boolean): TippyInstance<Props>;
}
