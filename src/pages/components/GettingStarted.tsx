import * as React from 'react';

export function GettingStarted() {
  return (
    <section className="container ordino-getting-started py-5">
      <div className="row">
        <div className="col position-relative text-center">
          <h1>Getting Started</h1>
          <h5>
          <p>
            The workflow of Coral consists of two steps: creating cohorts, and characterizing them.
            Operations from these two categories are carried out in an iterative workflow.
          </p>
          </h5>
        </div>
      </div>
      <ul className="row mx-0 mt-5 p-0 list-unstyled">
        <li className="col col-lg mb-sm-5 mb-lg-0 text-center">
          <h2>Cohort Creation</h2>
          <p>
            An initial cohort that contains all items of the selected dataset is created automatically.
            Creation operations allow users to create new sub-cohorts based on different attributes and attribute combinations.
            Cohorts are refined with the <i>Filter</i> operation, or divided into multiple cohorts with the <i>Split</i> operation.
          </p>
        </li>
        <li className="col col-lg mb-sm-5 mb-lg-0 text-center">
          <h2>Cohort Characterization</h2>
          <p>
            Characterization operations give insights into the cohorts.
            Similarities and differences between cohorts can be checked visually with the <i>View</i> operation, and statistically with the <i>Compare</i> operation.
            Additional operations give access to prevalence information and the data of individual items.
          </p>
        </li>
        {
          /*
          <li className="col col-lg mb-sm-5 mb-lg-0 text-center">
            <h2>Cohort Tracking</h2>
            <p>
              In the top half of the application, a graph presents how the cohorts were generated as well as their relationships.
              Coral also assigns a color to each selected cohort that is used throughout the application to visualize the cohort's data.
            </p>
          </li>
          */
        }
      </ul>
      <div className="row">
        <div className="col position-relative text-center">
          <a href="/app/" className="btn btn-outline-secondary btn-lg">Start Analysis</a>
        </div>
      </div>
    </section>
  );
}
