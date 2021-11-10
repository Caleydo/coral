import * as React from 'react';
import { HeaderNavigation, OrdinoFooter } from 'ordino';
export function Error404Page() {
    return (React.createElement(React.Fragment, null,
        React.createElement(HeaderNavigation, { bg: "none" }),
        React.createElement("div", { className: "container" },
            React.createElement("div", { className: "row" },
                React.createElement("div", { className: "col" },
                    React.createElement("h2", null, "Page Not Found")))),
        React.createElement(OrdinoFooter, null)));
}
//# sourceMappingURL=Error404Page.js.map