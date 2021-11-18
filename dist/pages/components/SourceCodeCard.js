import { useAsync } from 'tdp_core';
import { AppMetaDataUtils } from 'tdp_core';
import React from 'react';
export function SourceCodeCard() {
    const loadMetaData = React.useMemo(() => () => AppMetaDataUtils.getMetaData(), []);
    const { status, value } = useAsync(loadMetaData);
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "card shadow-sm p-2" },
            React.createElement("div", { className: "card-body" },
                React.createElement("p", { className: "card-text" },
                    "The source code of Coral is released at ",
                    React.createElement("a", { href: "https://github.com/Caleydo/Coral", target: "_blank", rel: "noopener" }, "GitHub"),
                    "."),
                React.createElement("p", { className: "card-text" }, "This application is part of Phovea, a platform for developing web-based visualization applications. For tutorials, API docs, and more information about the build and deployment process, see the documentation page."),
                React.createElement("p", { className: "card-text" },
                    React.createElement("b", null, "Version: "),
                    " ",
                    (status === 'success') ? value.version : 'Fetching current version ...')))));
}
//# sourceMappingURL=SourceCodeCard.js.map