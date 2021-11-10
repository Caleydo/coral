import * as loMerge from 'lodash.merge';
import { CONFIG_ONBOARDING } from './config/onboarding';
import tippy from 'tippy.js';
import { log, hasCookie } from './util';
export class OnboardingManager {
    static init(settings = {}) {
        const defaultSettings = CONFIG_ONBOARDING.defaultSettings;
        const appliedSettings = loMerge({}, defaultSettings, settings);
        tippy.setDefaultProps(appliedSettings);
    }
    static addTip(tipId, elem, forceShow = false) {
        const tipConfig = CONFIG_ONBOARDING.tooltips[tipId];
        let tip = undefined;
        if (tipConfig) {
            this.tooltips.forEach((tip) => tip.clearDelayTimeouts());
            const cookieID = `${tipId}_onboarded`;
            const showOnCreate = !hasCookie(cookieID) || forceShow; //show if there is no cookie
            tip = tippy(elem, {
                ...tipConfig,
                theme: 'onboarding',
                showOnCreate
            });
            this.tooltips.set(tipId, tip);
            setOnboardingCookie(cookieID);
        }
        else {
            log.warn('No config for tooltip', tipId, 'Skip tooltip creation');
        }
        return tip;
    }
}
OnboardingManager.tooltips = new Map();
function setOnboardingCookie(cookieName) {
    const exdays = 14;
    const expireDate = new Date();
    expireDate.setTime(expireDate.getTime() + (exdays * 24 * 60 * 60 * 1000));
    document.cookie = `${cookieName}=displayed; SameSite=Lax; expires=${expireDate.toUTCString()}`;
}
//# sourceMappingURL=OnboardingManager.js.map