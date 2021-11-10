import * as React from 'react';
import logoBI from '../../assets/logos/boehringer-ingelheim.svg';
import logoLab from '../../assets/logos/jku-vds-lab-logo.png';
import logoDatavisyn from '../../assets/logos/datavisyn.svg';

export function DevelopedByAffiliations() {
  return (
    <section className="container ordino-developed-by-affiliations py-5">
      <div className="row">
        <div className="col mb-3 text-center">
          <p className="lead text-ordino-gray-3">Coral is developed by</p>
        </div>
      </div>
      <div className="row">
        <div className="col text-center">
          <a href="https://jku-vds-lab.at/" target="_blank" rel="noopener noreferrer"><img src={logoLab} alt="JKU Visual Data Science Lab" style={{height: '45px'}} /></a>
        </div>
        <div className="col text-center">
          <a href="https://www.boehringer-ingelheim.com" target="_blank" rel="noopener noreferrer"><img src={logoBI} alt="Boehringer Ingelheim" style={{height: '45px'}} /></a>
        </div>
        <div className="col text-center">
          <a href="https://www.datavisyn.io" target="_blank" rel="noopener noreferrer"><img src={logoDatavisyn} alt="datavisyn" style={{height: '35px'}} /></a>
        </div>
      </div>
    </section>
  );
}
