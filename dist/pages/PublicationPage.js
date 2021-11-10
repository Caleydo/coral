import * as React from 'react';
import { HeaderNavigation, OrdinoFooter, OrdinoScrollspy, OrdinoScrollspyItem } from 'ordino';
function CoralPublication() {
    return React.createElement("div", { className: "row" },
        React.createElement("div", { className: "shadow-sm card p-2 overflow-hidden" },
            React.createElement("div", { className: "card-body" },
                React.createElement("iframe", { className: "mb-2", width: "100%", height: "100%", src: "https://www.youtube-nocookie.com/embed/vSd3a9J63wQ?autoplay=0", frameBorder: "0", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true }),
                React.createElement("h5", { className: "card-title" }, "Abstract"),
                React.createElement("p", { className: "card-text" }, "A main task in computational cancer analysis is the identification of patient subgroups (i.e., cohorts) based on metadata attributes (patient stratification) or genomic markers of response (biomarkers). Coral is a web-based cohort analysis tool that is designed to support this task: Users can interactively create and refine cohorts, which can then be compared, characterized, and inspected down to the level of single items. We visualize the evolution of cohorts and also provide intuitive access to prevalence information. Coral can be utilized to explore any type of cohort and sample set. Here, we focus on the analysis of genomic data from cancer patients and therefore included in the public version data from the AACR Project GENIE, The Cancer Genome Atlas, and the Cell Line Encyclopedia."),
                React.createElement("h5", { className: "card-title" }, "Citation"),
                React.createElement("p", { className: "card-text" },
                    "Patrick Adelberger, Klaus Eckelt, Markus J. Bauer, Marc Streit, Christian Haslinger, Thomas Zichner.",
                    React.createElement("br", null),
                    React.createElement("b", null, "Coral: a web-based visual analysis tool for creating and characterizing cohorts."),
                    React.createElement("br", null),
                    React.createElement("i", null, "Bioinformatics, doi:10.1093/bioinformatics/btab695, 2021."))),
            React.createElement("div", { className: "card-footer" },
                React.createElement("a", { href: "https://academic.oup.com/bioinformatics/advance-article/doi/10.1093/bioinformatics/btab695/6384564?guestAccessKey=8b1777b2-4157-46ff-b5c2-0a69f1931cce", target: "_blank", rel: "noopener noreferrer", className: "btn btn-light me-2" },
                    React.createElement("i", { className: "me-1 fas fa-globe-americas" }),
                    " Publisher"),
                React.createElement("a", { href: "https://academic.oup.com/bioinformatics/advance-article-pdf/doi/10.1093/bioinformatics/btab695/40532463/btab695.pdf?guestAccessKey=8b1777b2-4157-46ff-b5c2-0a69f1931cce", target: "_blank", className: "btn btn-light me-2" },
                    React.createElement("i", { className: "me-1 fas fa-file-pdf" }),
                    " Download"),
                React.createElement("a", { href: "https://github.com/Caleydo/Coral", target: "_blank", rel: "noopener noreferrer", className: "btn btn-light" },
                    React.createElement("i", { className: "me-1 fab fa-github" }),
                    " Source code"))));
}
function OrdinoPublication() {
    return React.createElement("div", { className: "row" },
        React.createElement("div", { className: "shadow-sm card p-2 overflow-hidden" },
            React.createElement("div", { className: "card-body" },
                React.createElement("iframe", { className: "mb-2", width: "100%", height: "100%", src: "https://www.youtube-nocookie.com/embed/TIDUsEOsI_Y?autoplay=0", frameBorder: "0", allow: "autoplay; clipboard-write; encrypted-media; picture-in-picture", allowFullScreen: true }),
                React.createElement("h5", { className: "card-title" }, "Abstract"),
                React.createElement("p", { className: "card-text" }, "Ordino is a web-based analysis tool for cancer genomics that allows users to flexibly rank, filter and explore genes, cell lines and tissue samples based on pre-loaded data, including The Cancer Genome Atlas, the Cancer Cell Line Encyclopedia and manually uploaded information. Interactive tabular data visualization that facilitates the user-driven prioritization process forms a core component of Ordino. Detail views of selected items complement the exploration. Findings can be stored, shared and reproduced via the integrated session management."),
                React.createElement("h5", { className: "card-title" }, "Citation"),
                React.createElement("p", { className: "card-text" },
                    "Marc Streit, Samuel Gratzl, Holger Stitz, Andreas Wernitznig, Thomas Zichner, Christian Haslinger.",
                    React.createElement("br", null),
                    React.createElement("b", null, "Ordino: visual analysis tool for ranking and exploring genes, cell lines, and tissue samples."),
                    React.createElement("br", null),
                    React.createElement("i", null, "Bioinformatics, 35(17): 3140-3142, 2019."))),
            React.createElement("div", { className: "card-footer" },
                React.createElement("a", { href: "https://dx.doi.org/10.1093/bioinformatics/btz009", target: "_blank", rel: "noopener noreferrer", className: "btn btn-light me-2" },
                    React.createElement("i", { className: "me-1 fas fa-globe-americas" }),
                    " Publisher"),
                React.createElement("a", { href: "https://academic.oup.com/bioinformatics/article-pdf/35/17/3140/29591819/btz009.pdf", target: "_blank", className: "btn btn-light me-2" },
                    React.createElement("i", { className: "me-1 fas fa-file-pdf" }),
                    " Download"),
                React.createElement("a", { href: "https://github.com/Caleydo/ordino_public", target: "_blank", rel: "noopener noreferrer", className: "btn btn-light" },
                    React.createElement("i", { className: "me-1 fab fa-github" }),
                    " Source code"))));
}
function TourdinoPublication() {
    return React.createElement("div", { className: "row" },
        React.createElement("div", { className: "shadow-sm card p-2 overflow-hidden" },
            React.createElement("div", { className: "card-body" },
                React.createElement("iframe", { className: "mb-2", width: "100%", height: "100%", src: "https://www.youtube-nocookie.com/embed/k6EPm6i-Vw4?autoplay=0", frameBorder: "0", allow: "autoplay; clipboard-write; encrypted-media; picture-in-picture", allowFullScreen: true }),
                React.createElement("h5", { className: "card-title" }, "Abstract"),
                React.createElement("p", { className: "card-text" }, "Seeking relationships and patterns in tabular data is a common data exploration task. To confirm hypotheses that are based on visual patterns observed during exploratory data analysis, users need to be able to quickly compare data subsets, and get further information on the significance of the result and the statistical test applied. Existing tools, however, either focus on the comparison of a single data type, such as comparing numerical attributes only, or provide little or no statistical evaluation to assess a hypothesis. To fill this gap, we present TourDino, a support view that helps users who are not experts in statistics to verify generated hypotheses and confirm insights gained during the exploration of tabular data. In TourDino we present an overview of the statistical significance of various row or column comparisons. On demand, we show further details, including the test score, a textual description, and a detail visualization explaining the results. To demonstrate the efficacy of our approach, we have integrated TourDino in the Ordino drug discovery platform for the purpose of identifying new drug targets."),
                React.createElement("h5", { className: "card-title" }, "Citation"),
                React.createElement("p", { className: "card-text" },
                    "Klaus Eckelt, Patrick Adelberger, Thomas Zichner, Andreas Wernitznig, Marc Streit.",
                    React.createElement("br", null),
                    React.createElement("b", null, "TourDino: A Support View for Confirming Patterns in Tabular Data."),
                    React.createElement("br", null),
                    React.createElement("i", null, "EuroVis Workshop on Visual Analytics (EuroVA '19), 2019."))),
            React.createElement("div", { className: "card-footer" },
                React.createElement("a", { href: "https://diglib.eg.org/handle/10.2312/eurova20191117", target: "_blank", rel: "noopener noreferrer", className: "btn btn-light me-2" },
                    React.createElement("i", { className: "me-1 fas fa-globe-americas" }),
                    "Publisher"),
                React.createElement("a", { href: "https://diglib.eg.org/bitstream/handle/10.2312/eurova20191117/007-011.pdf?sequence=1&isAllowed=y", target: "_blank", className: "btn btn-light me-2" },
                    React.createElement("i", { className: "me-1 fas fa-file-pdf" }),
                    " Download"),
                React.createElement("a", { href: "https://github.com/Caleydo/tourdino", target: "_blank", rel: "noopener noreferrer", className: "btn btn-light" },
                    React.createElement("i", { className: "me-1 fab fa-github" }),
                    " Source code"))));
}
function TagglePublication() {
    return React.createElement("div", { className: "row" },
        React.createElement("div", { className: "shadow-sm card p-2 overflow-hidden" },
            React.createElement("div", { className: "card-body" },
                React.createElement("iframe", { className: "mb-2", width: "100%", height: "100%", src: "https://www.youtube-nocookie.com/embed/t50KgQKK8EQ?autoplay=0", frameBorder: "0", allow: "autoplay; clipboard-write; encrypted-media; picture-in-picture", allowFullScreen: true }),
                React.createElement("h5", { className: "card-title" }, "Abstract"),
                React.createElement("p", { className: "card-text" }, "Most tabular data visualization techniques focus on overviews, yet many practical analysis tasks are concerned with investigating individual items of interest. At the same time, relating an item to the rest of a potentially large table is important. In this work we present Taggle, a tabular visualization technique for exploring and presenting large and complex tables. Taggle takes an item-centric, spreadsheet-like approach, visualizing each row in the source data individually using visual encodings for the cells. At the same time, Taggle introduces data-driven aggregation of data subsets. The aggregation strategy is complemented by interaction methods tailored to answer specific analysis questions, such as sorting based on multiple columns and rich data selection and filtering capabilities. We demonstrate Taggle using a case study conducted by a domain expert on complex genomics data analysis for the purpose of drug discovery."),
                React.createElement("h5", { className: "card-title" }, "Citation"),
                React.createElement("p", { className: "card-text" },
                    "Katarina Furmanova, Samuel Gratzl, Holger Stitz, Thomas Zichner, Miroslava Jaresova, Martin Ennemoser, Alexander Lex, Marc Streit.",
                    React.createElement("br", null),
                    React.createElement("b", null, "Taggle: Combining Overview and Details in Tabular Data Visualizations."),
                    React.createElement("br", null),
                    React.createElement("i", null, "Information Visualization, 19(2): 114-136, 2019."))),
            React.createElement("div", { className: "card-footer" },
                React.createElement("a", { href: "https://dx.doi.org/10.1177/1473871619878085", target: "_blank", rel: "noopener noreferrer", className: "btn btn-light me-2" },
                    React.createElement("i", { className: "me-1 fas fa-globe-americas" }),
                    " Publisher"),
                React.createElement("a", { href: "https://journals.sagepub.com/doi/pdf/10.1177/1473871619878085", target: "_blank", className: "btn btn-light me-2" },
                    React.createElement("i", { className: "me-1 fas fa-file-pdf" }),
                    " Download"),
                React.createElement("a", { href: "https://github.com/lineupjs/lineupjs", target: "_blank", rel: "noopener noreferrer", className: "btn btn-light" },
                    React.createElement("i", { className: "me-1 fab fa-github" }),
                    " Source code"))));
}
const publications = [
    {
        id: 'coral-publication',
        name: 'Coral',
        icon: 'fas fa-book-open',
        factory: () => React.createElement(CoralPublication, null)
    },
    {
        id: 'ordino-publication',
        name: 'Ordino',
        icon: 'fas fa-book-open',
        factory: () => React.createElement(OrdinoPublication, null)
    },
    {
        id: 'tourdino-publication',
        name: 'TourDino',
        icon: 'fas fa-book-open',
        factory: () => React.createElement(TourdinoPublication, null)
    },
    {
        id: 'taggle-publication',
        name: 'Taggle',
        icon: 'fas fa-book-open',
        factory: () => React.createElement(TagglePublication, null)
    },
];
export function PublicationPage() {
    return (React.createElement(React.Fragment, null,
        React.createElement(HeaderNavigation, { bg: "none" }),
        React.createElement("div", { className: "position-relative pt-6" },
            React.createElement(OrdinoScrollspy, { items: publications.map((publication) => ({ id: publication.id, name: publication.name })) }, (handleOnChange) => React.createElement(React.Fragment, null,
                React.createElement("div", { className: "ordino-publication-page container pb-6" },
                    React.createElement("div", { className: "row" },
                        React.createElement("div", { className: "col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2" },
                            React.createElement("p", { className: "lead text-gray-600 pt-6" },
                                "Coral and its components have been described in the following scientific publications.",
                                React.createElement("br", null),
                                "Please cite at least the first article when using Coral and publishing your results."))),
                    React.createElement("div", { className: "row" },
                        React.createElement("div", { className: "col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2" }, publications.map((item, index) => {
                            return (
                            // `id` attribute must match the one in the scrollspy
                            React.createElement(OrdinoScrollspyItem, { className: (index === 0) ? 'pt-3' : 'pt-6', id: item.id, key: item.name, index: index, handleOnChange: handleOnChange },
                                React.createElement(React.Fragment, null,
                                    React.createElement("h5", { className: "text-start mt-2 mb-3" },
                                        React.createElement("i", { className: `me-2 ordino-icon-2 ${item.icon}` }),
                                        " ",
                                        item.name),
                                    React.createElement(item.factory, null))));
                        })))),
                React.createElement(OrdinoFooter, null))))));
}
//# sourceMappingURL=PublicationPage.js.map