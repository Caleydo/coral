import * as React from 'react';
import { OrdinoFooter } from 'ordino';
import { CoralHero } from './components/CoralHero';
import { DevelopedByAffiliations } from './components/DevelopedByAffiliations';
import { CoralTeaserCards } from './components/CoralTeaserCards';
import { GettingStarted } from './components/GettingStarted';
export function HomePage() {
    return (React.createElement(React.Fragment, null,
        React.createElement(CoralHero, null),
        React.createElement("div", { className: "ordino-getting-started-wrapper" },
            React.createElement(GettingStarted, null),
            React.createElement("hr", { className: "m-0" }),
            React.createElement(DevelopedByAffiliations, null)),
        React.createElement(CoralTeaserCards, null),
        React.createElement(OrdinoFooter, null)));
}
//# sourceMappingURL=HomePage.js.map