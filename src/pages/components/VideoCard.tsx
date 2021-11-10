import * as React from 'react';
import {Link} from 'react-router-dom';

export interface IVideoCardProps {
  openInNewWindow?: boolean;
}

export function VideoCard({openInNewWindow}: IVideoCardProps) {

  const newWindowProps = openInNewWindow ? {
    target: '_blank',
    rel: 'noopener noreferrer'
  } : {};

  return (
    <div style={{overflow: 'hidden'}} className="card p-2 shadow-sm coral-video-card">

      <div className="card-body">
        <p className="card-text lead">
          Coral is a cohort analysis tool to interactively create and refine patient cohorts,
          while visualizing their provenance in the Cohort Evolution Graph. <br />
          The resulting cohorts can then be compared, characterized, and inspected down to the level of single entities.
        </p>
        <iframe className="w-100 pt-2 pb-1" src="https://www.youtube-nocookie.com/embed/vSd3a9J63wQ?autoplay=0" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>

        <h5 className="card-title mt-4">
          <i className="me-2 fas fa-check"></i>Workflow and Features
        </h5>
        <p className="card-text">
          The workflow of Coral consists of two steps: creating cohorts, and characterizing them.
          Operations from these two categories are carried out in an iterative workflow.<br />
          <i>Creation operations</i> allow users to create new sub-cohorts based on different attributes and attribute combinations.
          <i>Characterization operations</i> give insights into the cohorts.
        </p>
        <p className="card-text">
          You can find more details on Coral's workflow and features in the <Link className="card-link" to="/features">Features</Link> section.
        </p>

        <h5 className="card-title mt-4">
          <i className="me-2 fas fa-database"></i>Datasets
        </h5>
        <p className="card-text">
          Coral's database contains  metadata as well as mutation data from the AACR Project GENIE,
          mRNA expression, DNA copy number, and mutation data from The Cancer Genome Atlas (TCGA) and the Cell Line Encyclopedia (CCLE).
          Furthermore, two CRISPR / RNAi loss-of-function screen data sets (DRIVE and Avana) are included.
        </p>
        <p className="card-text">
          You can find more detailed information about the datasets <Link {...newWindowProps} className="card-link" to="/datasets">here</Link>.
        </p>

        <h5 className="card-title mt-4">
          <i className="me-2 fas fa-book-open"></i>Publications
        </h5>
        <p className="card-text">
          Coral and its components have been described in the following scientific publications.
        </p>
        <p className="card-text text-muted">
          Patrick Adelberger, Klaus Eckelt, Markus J. Bauer, Marc Streit, Christian Haslinger, Thomas Zichner.<br />
          <b>Coral: a web-based visual analysis tool for creating and characterizing cohorts.</b><br />
          <i> Bioinformatics, doi:10.1093/bioinformatics/btab695, 2021.</i>
        </p>
        <p className="card-text text-muted">
          Marc Streit, Samuel Gratzl, Holger Stitz, Andreas Wernitznig, Thomas Zichner, Christian Haslinger.<br />
          <b>Ordino: visual analysis tool for ranking and exploring genes, cell lines, and tissue samples.</b><br />
          <i> Bioinformatics, 35(17): 3140-3142, 2019.</i>
        </p>
        <p className="card-text text-muted">
          Klaus Eckelt, Patrick Adelberger, Thomas Zichner, Andreas Wernitznig, Marc Streit.<br />
          <b>TourDino: A Support View for Confirming Patterns in Tabular Data.</b><br />
          <i>EuroVis Workshop on Visual Analytics (EuroVA '19), 2019.</i>
        </p>
        <p className="card-text text-muted">
          Katarina Furmanova, Samuel Gratzl, Holger Stitz, Thomas Zichner, Miroslava Jaresova, Martin Ennemoser, Alexander Lex, Marc Streit.<br />
          <b>Taggle: Combining Overview and Details in Tabular Data Visualizations.</b><br />
          <i>Information Visualization, 19(2): 114-136, 2019.</i>
        </p>
        <p className="card-text">
          Please cite the first article when using Coral and publishing your results.
        </p>
        <p className="card-text">
          You can find more information about the publications <Link {...newWindowProps} className="card-link" to="/publications">here</Link>.
        </p>
      </div>
    </div>
  );
}
