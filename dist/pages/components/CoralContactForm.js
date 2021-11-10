import * as React from 'react';
const CONTACT_FORM_EMAIL = 'coral@caleydo.org';
export function CoralContactForm() {
    const handleSubmit = React.useCallback((event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);
        const subject = data.get('subject').toString();
        const message = data.get('message').toString();
        let parameters = subject || message ? '?' : '';
        if (subject) {
            parameters += `subject=${encodeURIComponent(subject)}`;
        }
        if (message) {
            parameters += `${subject ? '&' : ''}body=${encodeURIComponent(message)}`;
        }
        form.reset();
        window.location.href = 'mailto:' + CONTACT_FORM_EMAIL + parameters;
    }, []);
    return (React.createElement("div", { className: "card shadow-sm p-2" },
        React.createElement("div", { className: "card-body" },
            React.createElement("p", { className: "card-text" },
                'Do you have questions or found a bug, do not hesitate to contact us using the contact form below. You can also contact us by writing an email to ',
                React.createElement("a", { className: "card-link", href: "mailto:coral@caleydo.org." }, "coral@caleydo.org"),
                ". We are glad to help you."),
            React.createElement("form", { onSubmit: handleSubmit },
                React.createElement("div", { className: "row-cols-md-3 mb-3" },
                    React.createElement("label", { className: "form-label" }, "Type of contact"),
                    React.createElement("select", { name: "subject", className: "form-select" },
                        React.createElement("option", null, "I have some general feedback"),
                        React.createElement("option", null, "I have a question"),
                        React.createElement("option", null, "I want to report a bug"))),
                React.createElement("div", { className: "mb-3" },
                    React.createElement("label", { className: "form-label" }, "Message"),
                    React.createElement("textarea", { className: "form-control", name: "message", rows: 5 })),
                React.createElement("div", { className: "justify-content-end row" },
                    React.createElement("div", { className: "col-md-auto" },
                        React.createElement("button", { title: "Send Message", type: "submit", className: "btn btn-secondary" }, "Send Message")))))));
}
//# sourceMappingURL=CoralContactForm.js.map