import * as React from 'react';
export function FeatureCard({ image, title, config, children }) {
    let htmlImage = '';
    // only assigning an image element, if image is not null
    if (image) {
        htmlImage = React.createElement("img", { className: "img-fluid mt-3 me-3 img-thumbnail position-absolute top-0 end-0", src: image.file, alt: image.altText });
    }
    return (React.createElement("div", { className: "col mt-4" },
        React.createElement("div", { className: "card shadow-sm h-100" },
            React.createElement("div", { className: "card-body p-3" },
                React.createElement("h5", { className: "card-title mb-4" }, title),
                React.createElement("p", null,
                    React.createElement("b", null, "Number of Attribtues:"),
                    " ",
                    config.numbAttr,
                    React.createElement("br", null),
                    React.createElement("b", null, "Type of Attribtues:"),
                    " ",
                    config.attribute),
                htmlImage,
                children))));
}
//# sourceMappingURL=FeatureCard.js.map