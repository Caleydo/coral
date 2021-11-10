import 'ordino/dist/robots.txt';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HashRouter, Switch, Route } from 'react-router-dom';
import { HomePage, NewsPage, FeaturesPage, DatasetsPage, PublicationPage, HelpPage } from './pages';
import { RouterScrollToTop } from './utils';
import { Error404Page } from './pages/Error404Page';
ReactDOM.render(React.createElement(React.Fragment, null,
    React.createElement(HashRouter, null,
        React.createElement(RouterScrollToTop, null),
        React.createElement(Switch, null,
            React.createElement(Route, { path: "/news/:slug" },
                React.createElement(NewsPage, null)),
            React.createElement(Route, { path: "/news" },
                React.createElement(NewsPage, null)),
            React.createElement(Route, { path: "/features" },
                React.createElement(FeaturesPage, null)),
            React.createElement(Route, { path: "/datasets" },
                React.createElement(DatasetsPage, null)),
            React.createElement(Route, { path: "/publications" },
                React.createElement(PublicationPage, null)),
            React.createElement(Route, { path: "/help/:slug" },
                React.createElement(HelpPage, null)),
            React.createElement(Route, { path: "/help" },
                React.createElement(HelpPage, null)),
            React.createElement(Route, { exact: true, path: "/" },
                React.createElement(HomePage, null)),
            React.createElement(Route, null,
                React.createElement(Error404Page, null))))), document.querySelector('#welcome'));
//# sourceMappingURL=initialize.welcome.js.map