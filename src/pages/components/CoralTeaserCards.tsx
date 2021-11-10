import * as React from 'react';
import {Link} from 'react-router-dom';

export function CoralTeaserCards() {
  return (
    <div className="coral-teaser-cards container">
      <div className="row row-cols-1 row-cols-md-2 my-5">
        <div className="col mb-4">
          <h4 className="text-center mb-3"><i className="me-2 ordino-icon-2 fas fa-newspaper"></i> What's new?</h4>
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <p className="card-text">
                🎉 It's the 2-year anniversary of Coral and we're happy to launch Coral v1.0! 🚀
              </p>
              <p className="card-text">
                This websites introduces Coral's <Link to="/features">features</Link>, the <Link to="/datasets">available datasets</Link>, and <Link to="/publications">publications</Link>.
                We also provide an <Link to="/help">introductory video</Link> to get to know Coral.
              </p>
              <p className="card-text">
                In the upcoming releases, we will focus improving the usability and interactions with Coral.
              </p>
            </div>
            <div className="card-footer"><Link to="/news" className="btn btn-light"><i className="me-1 fas fa-angle-right"></i> Read the release notes</Link></div>
          </div>
        </div>
        <div className="col mb-4">
          <h4 className="text-center mb-3"><i className="me-2 ordino-icon-2 fas fa-book-open"></i> Publication</h4>
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <p className="card-text">
                Coral and its components have been published in multiple scientific articles. Please cite the following article when using Coral and publishing your results.
              </p>
              <p className="card-text text-muted">
                Patrick Adelberger, Klaus Eckelt, Markus J. Bauer, Marc Streit, Christian Haslinger, Thomas Zichner.<br />
                <b>Coral: a web-based visual analysis tool for creating and characterizing cohorts.</b><br />
                <i>Bioinformatics, doi:<a href="https://academic.oup.com/bioinformatics/advance-article/doi/10.1093/bioinformatics/btab695/6384564?guestAccessKey=8b1777b2-4157-46ff-b5c2-0a69f1931cce" target="_blank" rel="noopener noreferrer">10.1093/bioinformatics/btab695</a>, 2021.</i>
              </p>
            </div>
            <div className="card-footer"><Link to="/publications" className="btn btn-light"><i className="me-1 fas fa-angle-right"></i> List of all publications</Link></div>
          </div>
        </div>
      </div>
    </div>
  );
}
