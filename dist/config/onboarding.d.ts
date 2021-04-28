import { Props } from 'tippy.js';
export declare const CONFIG_ONBOARDING: ITippyConfig;
interface ITippyConfig {
    defaultSettings: Partial<Props>;
    tooltips: {
        [tipId: string]: Partial<Props>;
    };
}
export {};
