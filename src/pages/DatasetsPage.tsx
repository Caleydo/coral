import {HeaderNavigation, OrdinoFooter} from 'ordino';
import * as React from 'react';

interface IDatasetPageCardProps {
  title: string;
  children?: React.ReactNode;
}


export function DatasetPageCard({title, children}: IDatasetPageCardProps) {
  return (
    <div className="card shadow-sm h-100">
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        {children}
      </div>
    </div>
  );
}


export function DatasetsPage() {
  return (
    <>
      <HeaderNavigation bg="none"></HeaderNavigation>
      <div className="position-relative pt-6">
        <div className="ordino-container">
          <div className="dataset-page py-6 container">
            <div className="row">
              <div className="col">
                <h4 className="text-start d-flex align-items-center mt-2 mb-3"><i className="me-2 ordino-icon-1 fas fa-chevron-circle-right" ></i> Basic Datasets</h4>
              </div>
            </div>
            <div className="row row-cols-md-2 row-cols-1">
              <div className="col">
                <DatasetPageCard title="AACR Project GENIE | American Association for Cancer Research (AACR)">
                  <p className="card-text">Sample annotation and mutation data</p>
                  <a className="card-link" href="https://www.aacr.org/professionals/research/aacr-project-genie/" target="_blank" rel="noopener">www.aacr.org/professionals/research/aacr-project-genie</a>
                </DatasetPageCard>
              </div>
              <div className="col">
                <DatasetPageCard title="The Cancer Genome Atlas (TCGA)">
                  <p className="card-text">Sample annotation, gene expression, mutation, and copy number data </p>
                  <a className="card-link" href="https://cancergenome.nih.gov" target="_blank" rel="noopener">cancergenome.nih.gov</a>
                </DatasetPageCard>
              </div>
            </div>

            <div className="row row-cols-md-2 row-cols-1 mt-4">
              <div className="col">
                <DatasetPageCard title="Cancer Cell Line Encyclopedia (CCLE)">
                  <p className="card-text">Sample annotation, gene expression, mutation, and copy number data</p>
                  <a className="card-link" href="https://portals.broadinstitute.org/ccle" target="_blank" rel="noopener">portals.broadinstitute.org/ccle</a>
                </DatasetPageCard>
              </div>
            </div>
            <div className="row mt-4">
              <div className="col">
                <h4 className="text-start d-flex align-items-center mt-2 mb-3"><i className="me-2 fas ordino-icon-1 fa-chevron-circle-right" ></i> Depletion Sceen Data</h4>
              </div>
            </div>

            <div className="row row-cols-md-2 row-cols-1">
              <div className="col">
                <DatasetPageCard title="Project DRIVE">
                  <p className="card-text">RNAi depletion screen data (RSA and ATARiS)</p>
                  <a className="card-link" href="https://doi.org/10.1016/j.cell.2017.07.005" target="_blank" rel="noopener"> McDonald III, E. R. et. al.
                    Project DRIVE: A Compendium of Cancer Dependencies and Synthetic Lethal Relationships Uncovered by Large-Scale, Deep RNAi Screening.
                    Cell 170, Pages 577-592.e10 (2017).</a>
                </DatasetPageCard>
              </div>
              <div className="col">
                <DatasetPageCard title="Avana CERES">
                  <p className="card-text">CRISPR-Cas9 depletion screen data</p>
                  <a className="card-link" href="https://doi.org/10.1038/ng.3984" target="_blank" rel="noopener">Meyers, R. M. et. al. Computational correction of copy
                    number effect improves specificity of CRISPR–Cas9 essentiality screens in cancer cells. Nature Genetics 49, 1779–1784 (2017).</a>
                </DatasetPageCard>
              </div>
            </div>
          </div>
          <OrdinoFooter></OrdinoFooter>
        </div>
      </div>
    </>
  );
}
