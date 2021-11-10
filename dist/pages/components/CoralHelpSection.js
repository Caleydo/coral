import React from 'react';
import { DisclaimerCard } from './DisclaimerCard';
import { CoralContactForm } from './CoralContactForm';
import { OrdinoScrollspy, OrdinoScrollspyItem } from 'ordino';
import { VideoCard } from './VideoCard';
import { TermsOfUseCard } from './TermsOfUseCard';
import { SourceCodeCard } from './SourceCodeCard';
const cards = [
    {
        id: 'coral-at-a-glance',
        name: 'Coral at a Glance',
        icon: 'fas fa-eye',
        factory: (props) => React.createElement(VideoCard, Object.assign({}, props))
    },
    {
        id: 'contact-us',
        name: 'Contact us',
        icon: 'fas fa-at',
        factory: () => React.createElement(CoralContactForm, null)
    },
    {
        id: 'disclaimer',
        name: 'Disclaimer',
        icon: 'fas fa-exclamation-triangle',
        factory: () => React.createElement(DisclaimerCard, null)
    },
    {
        id: 'terms-of-use',
        name: 'Terms of use',
        icon: 'fas fa-user-tie',
        factory: () => React.createElement(TermsOfUseCard, null)
    },
    {
        id: 'source-code-licenses',
        name: 'Source code',
        icon: 'fas fa-code',
        factory: () => React.createElement(SourceCodeCard, null)
    },
];
export function CoralHelpSection(props) {
    return (React.createElement(React.Fragment, null,
        React.createElement(OrdinoScrollspy, { items: cards.map((item) => ({ id: item.id, name: item.name })) }, (handleOnChange) => React.createElement(React.Fragment, null,
            React.createElement("div", { className: "container pb-5" },
                React.createElement("div", { className: "row" },
                    React.createElement("div", { className: "col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2" }, cards.map((item, index) => {
                        return (
                        // `id` attribute must match the one in the scrollspy
                        React.createElement(OrdinoScrollspyItem, { className: "pt-6", id: item.id, key: item.name, index: index, handleOnChange: handleOnChange },
                            React.createElement(React.Fragment, null,
                                React.createElement("h4", { className: "text-start  mt-2 mb-3" },
                                    React.createElement("i", { className: `me-2 ordino-icon-2 ${item.icon}` }),
                                    " ",
                                    item.name),
                                React.createElement(item.factory, Object.assign({}, { openInNewWindow: props.openInNewWindow })))));
                    })))),
            props.children))));
}
//# sourceMappingURL=CoralHelpSection.js.map