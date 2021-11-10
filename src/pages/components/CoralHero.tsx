import * as React from 'react';
import {Link} from 'react-router-dom';
import ordinoHero from '../../assets/coral-hero.png';
import {HeaderNavigation} from 'ordino';

const INTRO_VIDEO_MODAL_ID = 'coral-intro-video-modal';

export function CoralHero() {
  const [modalIsClosed, setModalIsClosed] = React.useState(true);
  const videoRef = React.useRef(null);

  const handleCloseModal = (event: React.MouseEvent<HTMLElement>) => {
    const target = (event.target as HTMLElement);
    // backdrop === modal node
    if (target.id === INTRO_VIDEO_MODAL_ID) {
      setModalIsClosed(true);
    }
  };

  return (
    <>
      <div className="coral-hero">
        <HeaderNavigation bg="none"></HeaderNavigation>
        <div className="container">
          <div className="row coral-hero-claim my-4">
            <div className="col text-center">
              <p>Coral is a cohort analysis tool to interactively create and refine patient cohorts, <br/>while visualizing their provenance in the Cohort Evolution Graph. The resulting cohorts can then <br/>be compared, characterized, and inspected down to the level of single entities.</p>
            </div>
          </div>
          <div className="row coral-hero-actions my-4">
            <div className="col text-center">
              <button type="button" className="btn btn-link btn-lg" onClick={() => setModalIsClosed(false)} data-bs-toggle="modal" data-bs-target={`#${INTRO_VIDEO_MODAL_ID}`}>
                <i className="fas fa-play"></i>
              Watch intro video
            </button>
            </div>
            <div className="col text-center">
              <Link to="/help" className="btn btn-link btn-lg">
                <i className="fas fa-question"></i>
              Learn more about Coral
            </Link>
            </div>
          </div>
          <div className="row coral-hero-image mt-5">
            <div className="col">
              <img src={ordinoHero} alt="Screenshot of an analysis with Coral" />
            </div>
          </div>
        </div>
      </div>
      <div className="modal" id={INTRO_VIDEO_MODAL_ID} onClick={handleCloseModal} aria-labelledby="coral-intro-video-modal-title" aria-hidden="true">
        <div className="modal-dialog coral-intro-video-modal">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title h4" >Introduction to Coral</div>
              <button type="button" className="btn-close" onClick={() => setModalIsClosed(true)} data-bs-dismiss="modal" aria-label="Close">
              </button>
            </div>
            <div className="modal-body">
              {/*<p>The video was produced with an earlier Coral version and shows a slightly different user interface compared to the current app.</p>*/}
              {!modalIsClosed && <iframe ref={videoRef} width="1280" height="720" src="https://www.youtube-nocookie.com/embed/vSd3a9J63wQ" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
