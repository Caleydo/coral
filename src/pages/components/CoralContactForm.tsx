import * as React from 'react';

const CONTACT_FORM_EMAIL = 'coral@caleydo.org';

export function CoralContactForm() {
    const handleSubmit = React.useCallback((event: React.SyntheticEvent) => {
        event.preventDefault();
        const form = event.currentTarget as HTMLFormElement;
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

    return (
        <div className="card shadow-sm p-2">
            <div className="card-body">
                <p className="card-text">
                    {'Do you have questions or found a bug, do not hesitate to contact us using the contact form below. You can also contact us by writing an email to '}
                    <a className="card-link" href="mailto:coral@caleydo.org.">coral@caleydo.org</a>. We are glad to help you.
                 </p>
                <form onSubmit={handleSubmit}>
                    <div className="row-cols-md-3 mb-3">
                        <label className="form-label">Type of contact</label>
                        <select name="subject" className="form-select">
                            <option>I have some general feedback</option>
                            <option>I have a question</option>
                            <option>I want to report a bug</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Message</label>
                        <textarea className="form-control" name="message" rows={5}></textarea>
                    </div>

                    <div className="justify-content-end row">
                        <div className="col-md-auto">
                            <button title="Send Message" type="submit" className="btn btn-secondary" >
                                Send Message
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
