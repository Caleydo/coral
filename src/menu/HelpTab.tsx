import {OrdinoFooter} from 'ordino';
import * as React from 'react';
import {BrowserRouter} from 'react-router-dom';
import {DevelopedByAffiliations} from '../pages/components/DevelopedByAffiliations';
import {CoralHelpSection} from '../pages/components/CoralHelpSection';

export default function HelpTab() {
    return <>
        <BrowserRouter basename="/#">
            <CoralHelpSection openInNewWindow>
                <DevelopedByAffiliations></DevelopedByAffiliations>
                <OrdinoFooter openInNewWindow></OrdinoFooter>
            </CoralHelpSection>
        </BrowserRouter>
    </>;
}
