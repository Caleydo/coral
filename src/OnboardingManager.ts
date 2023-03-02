import * as loMerge from 'lodash.merge';
import tippy, { Props, Instance as TippyInstance } from 'tippy.js';
import { CONFIG_ONBOARDING } from './config/onboarding';
import { log, hasCookie } from './util';

export class OnboardingManager {
  static tooltips = new Map<string, TippyInstance<Props>>();

  public static init(settings: any = {}) {
    const { defaultSettings } = CONFIG_ONBOARDING;
    const appliedSettings = loMerge({}, defaultSettings, settings);

    tippy.setDefaultProps(appliedSettings);
  }

  static addTip(tipId: string, elem: HTMLElement, forceShow = false): TippyInstance<Props> {
    const tipConfig = CONFIG_ONBOARDING.tooltips[tipId];
    let tip;
    if (tipConfig) {
      this.tooltips.forEach((tip) => tip.clearDelayTimeouts());
      const cookieID = `${tipId}_onboarded`;
      const showOnCreate = !hasCookie(cookieID) || forceShow; // show if there is no cookie
      tip = tippy(elem, {
        ...tipConfig,
        theme: 'onboarding',
        showOnCreate,
      });
      this.tooltips.set(tipId, tip);
      setOnboardingCookie(cookieID);
    } else {
      log.warn('No config for tooltip', tipId, 'Skip tooltip creation');
    }
    return tip;
  }
}

function setOnboardingCookie(cookieName) {
  const exdays = 14;
  const expireDate = new Date();
  expireDate.setTime(expireDate.getTime() + exdays * 24 * 60 * 60 * 1000);

  document.cookie = `${cookieName}=displayed; SameSite=Lax; expires=${expireDate.toUTCString()}`;
}
