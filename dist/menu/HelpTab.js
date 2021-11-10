import { OrdinoFooter } from 'ordino';
import * as React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { DevelopedByAffiliations } from '../pages/components/DevelopedByAffiliations';
import { CoralHelpSection } from '../pages/components/CoralHelpSection';
export default function HelpTab() {
    return React.createElement(React.Fragment, null,
        React.createElement(BrowserRouter, { basename: "/#" },
            React.createElement(CoralHelpSection, { openInNewWindow: true },
                React.createElement(DevelopedByAffiliations, null),
                React.createElement(OrdinoFooter, { openInNewWindow: true }))));
}
//# sourceMappingURL=HelpTab.js.map