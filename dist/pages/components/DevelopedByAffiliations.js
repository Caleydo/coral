import * as React from 'react';
import logoBI from '../../assets/logos/boehringer-ingelheim.svg';
import logoLab from '../../assets/logos/jku-vds-lab-logo.png';
import logoDatavisyn from '../../assets/logos/datavisyn.svg';
export function DevelopedByAffiliations() {
    return (React.createElement("section", { className: "container ordino-developed-by-affiliations py-5" },
        React.createElement("div", { className: "row" },
            React.createElement("div", { className: "col mb-3 text-center" },
                React.createElement("p", { className: "lead text-ordino-gray-3" }, "Coral is developed by"))),
        React.createElement("div", { className: "row" },
            React.createElement("div", { className: "col text-center" },
                React.createElement("a", { href: "https://jku-vds-lab.at/", target: "_blank", rel: "noopener noreferrer" },
                    React.createElement("img", { src: logoLab, alt: "JKU Visual Data Science Lab", style: { height: '45px' } }))),
            React.createElement("div", { className: "col text-center" },
                React.createElement("a", { href: "https://www.boehringer-ingelheim.com", target: "_blank", rel: "noopener noreferrer" },
                    React.createElement("img", { src: logoBI, alt: "Boehringer Ingelheim", style: { height: '45px' } }))),
            React.createElement("div", { className: "col text-center" },
                React.createElement("a", { href: "https://www.datavisyn.io", target: "_blank", rel: "noopener noreferrer" },
                    React.createElement("img", { src: logoDatavisyn, alt: "datavisyn", style: { height: '35px' } }))))));
}
//# sourceMappingURL=DevelopedByAffiliations.js.map