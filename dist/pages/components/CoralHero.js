import * as React from 'react';
import { Link } from 'react-router-dom';
import ordinoHero from '../../assets/coral-hero.png';
import { HeaderNavigation } from 'ordino';
const INTRO_VIDEO_MODAL_ID = 'coral-intro-video-modal';
export function CoralHero() {
    const [modalIsClosed, setModalIsClosed] = React.useState(true);
    const videoRef = React.useRef(null);
    const handleCloseModal = (event) => {
        const target = event.target;
        // backdrop === modal node
        if (target.id === INTRO_VIDEO_MODAL_ID) {
            setModalIsClosed(true);
        }
    };
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "coral-hero" },
            React.createElement(HeaderNavigation, { bg: "none" }),
            React.createElement("div", { className: "container" },
                React.createElement("div", { className: "row coral-hero-claim my-4" },
                    React.createElement("div", { className: "col text-center" },
                        React.createElement("p", null,
                            "Coral is a cohort analysis tool to interactively create and refine patient cohorts, ",
                            React.createElement("br", null),
                            "while visualizing their provenance in the Cohort Evolution Graph. The resulting cohorts can then ",
                            React.createElement("br", null),
                            "be compared, characterized, and inspected down to the level of single entities."))),
                React.createElement("div", { className: "row coral-hero-actions my-4" },
                    React.createElement("div", { className: "col text-center" },
                        React.createElement("button", { type: "button", className: "btn btn-link btn-lg", onClick: () => setModalIsClosed(false), "data-bs-toggle": "modal", "data-bs-target": `#${INTRO_VIDEO_MODAL_ID}` },
                            React.createElement("i", { className: "fas fa-play" }),
                            "Watch intro video")),
                    React.createElement("div", { className: "col text-center" },
                        React.createElement(Link, { to: "/help", className: "btn btn-link btn-lg" },
                            React.createElement("i", { className: "fas fa-question" }),
                            "Learn more about Coral"))),
                React.createElement("div", { className: "row coral-hero-image mt-5" },
                    React.createElement("div", { className: "col" },
                        React.createElement("img", { src: ordinoHero, alt: "Screenshot of an analysis with Coral" }))))),
        React.createElement("div", { className: "modal", id: INTRO_VIDEO_MODAL_ID, onClick: handleCloseModal, "aria-labelledby": "coral-intro-video-modal-title", "aria-hidden": "true" },
            React.createElement("div", { className: "modal-dialog coral-intro-video-modal" },
                React.createElement("div", { className: "modal-content" },
                    React.createElement("div", { className: "modal-header" },
                        React.createElement("div", { className: "modal-title h4" }, "Introduction to Coral"),
                        React.createElement("button", { type: "button", className: "btn-close", onClick: () => setModalIsClosed(true), "data-bs-dismiss": "modal", "aria-label": "Close" })),
                    React.createElement("div", { className: "modal-body" }, !modalIsClosed && React.createElement("iframe", { ref: videoRef, width: "1280", height: "720", src: "https://www.youtube-nocookie.com/embed/vSd3a9J63wQ", frameBorder: "0", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true })))))));
}
//# sourceMappingURL=CoralHero.js.map