
import * as React from 'react';
import {HeaderNavigation, OrdinoFooter} from 'ordino';
import {DevelopedByAffiliations} from './components/DevelopedByAffiliations';
import {CoralHelpSection} from './components/CoralHelpSection';
import {useScrollToSlug} from 'ordino';

export function HelpPage() {
  useScrollToSlug();

  return (
    <>
      <HeaderNavigation bg="none"></HeaderNavigation>
      <div className="container-fluid ordino-help-page h-100 position-relative pt-6">
        <CoralHelpSection>
          <DevelopedByAffiliations />
          <OrdinoFooter />
        </CoralHelpSection>
      </div>
    </>
  );
}
