import * as React from 'react';
import {HeaderNavigation, OrdinoFooter, OrdinoScrollspy, OrdinoScrollspyItem, useScrollToSlug} from 'ordino';
import {Link} from 'react-router-dom';
import confetti from 'canvas-confetti';

import coralHero from '../assets/coral-hero.png';
import {hasCookie} from '../util';

const sections = [
  {
    id: 'v1-0',
    name: 'Version 1.0',
    date: '2021-11-11',
    markup: () => (
      <>
        <h4 className="my-4">Hello Coral! 🐣</h4>

        <p>
          This is the first release of Coral.
          Coral is a cohort analysis tool to interactively create and refine cohorts, which can then be compared, characterized, and inspected down to the level of single items.
        </p>

        <img className="img-fluid mb-4" src={coralHero} alt="Screenshot of an analysis in Coral." />

        <p>
          Coral comes with this dedicated homepage to welcome new users, providing an overview of <Link to="/features">the features</Link>, <Link to="/datasets">available datasets</Link>, and <Link to="/publications">publications</Link>.
          For an overview of Coral's features, we also provide an <Link to="/help">introductory video</Link> to get to know Coral.
        </p>

        <p>
          In the future, we will also present the most recent changes and developments here. <br />
          You can skip this welcome page and start the analysis in Coral directly, by going to the <a href="./app" target="_blank" rel="noopener noreferrer"><code>/app</code></a> subsite.
        </p>
      </>
    )
  }
];



export function NewsPage() {
  useScrollToSlug();

  React.useEffect(() => {
    const celebrationCookieKey = sections[0]?.id + '_celebrated';
    if (!hasCookie(celebrationCookieKey)) {
      document.cookie = `${celebrationCookieKey}=true; SameSite=Lax;`;

      // only celebrate recent releases
      const timeDiff = new Date().getTime() - new Date(sections[0].date).getTime();
      const maxTimeDiff = 2 * 7 * 24 * 60 * 60 * 1000; // two weeks in millis
      if (timeDiff < maxTimeDiff) {
        confetti({particleCount: 150, spread: 100, origin: {x: 0.2, y: 0.7}, angle: 45});
        confetti({particleCount: 150, spread: 100, origin: {x: 0.7, y: 0.7}, angle: 135});
      }
    }
  }, []);

  return (
    <>
      <HeaderNavigation bg="none"></HeaderNavigation>
      <div className="position-relative py-6">
        <OrdinoScrollspy items={sections.map((section) => ({id: section.id, name: section.name}))}>
          {(handleOnChange) =>
            <>
              <div className="container pb-6">
                <div className="row">
                  <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                    {sections.map((item, index) => {
                      return (
                        // `id` attribute must match the one in the scrollspy
                        <OrdinoScrollspyItem className="pt-6" id={item.id} key={item.name} index={index} handleOnChange={handleOnChange}>
                          <>
                            <h4 className="text-start mt-2 d-flex align-items-center mb-3"><i className="me-2 ordino-icon-1 fas fa-chevron-circle-right"></i> {item.name} ({item.date})</h4>
                            <div className="card shadow-sm h-100">
                              <div className="card-body">
                                {item.markup()}
                              </div>
                            </div>
                          </>
                        </OrdinoScrollspyItem>
                      );
                    })}
                  </div>
                </div>
              </div>
              <OrdinoFooter></OrdinoFooter>
            </>
          }
        </OrdinoScrollspy>
      </div>
    </>
  );
}