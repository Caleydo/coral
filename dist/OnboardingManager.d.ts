import { Props, Instance } from 'tippy.js';
export declare class OnboardingManager {
    static tooltips: Map<String, Instance<Props>>;
    static init(settings?: any): void;
    static addTip(tipId: string, elem: HTMLElement): any;
}
