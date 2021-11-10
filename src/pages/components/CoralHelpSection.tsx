import React from 'react';
import {DisclaimerCard} from './DisclaimerCard';
import {CoralContactForm} from './CoralContactForm';
import {OrdinoScrollspy, OrdinoScrollspyItem} from 'ordino';
import {VideoCard, IVideoCardProps} from './VideoCard';
import {TermsOfUseCard} from './TermsOfUseCard';
import {SourceCodeCard} from './SourceCodeCard';

const cards = [
    {
        id: 'coral-at-a-glance',
        name: 'Coral at a Glance',
        icon: 'fas fa-eye',
        factory: (props: IVideoCardProps) => <VideoCard {...props} />
    },
    {
        id: 'contact-us',
        name: 'Contact us',
        icon: 'fas fa-at',
        factory: () => <CoralContactForm />

    },
    {
        id: 'disclaimer',
        name: 'Disclaimer',
        icon: 'fas fa-exclamation-triangle',
        factory: () => <DisclaimerCard />

    },
    {
        id: 'terms-of-use',
        name: 'Terms of use',
        icon: 'fas fa-user-tie',
        factory: () => <TermsOfUseCard />
    },
    {
        id: 'source-code-licenses',
        name: 'Source code',
        icon: 'fas fa-code',
        factory: () => <SourceCodeCard />
    },
];


interface ICoralHelpSectionProps {
    /**
     * Whether to open the links to other pages in a new tab
     */
    openInNewWindow?: boolean;
    children?: React.ReactNode;
}

export function CoralHelpSection(props: ICoralHelpSectionProps) {
    return (<>
        <OrdinoScrollspy items={cards.map((item) => ({id: item.id, name: item.name}))}>
            {(handleOnChange) =>
                <>
                    <div className="container pb-5">
                        <div className="row">
                            <div className="col-12 col-xl-10 offset-xl-1 col-xxl-8 offset-xxl-2">
                                {cards.map((item, index) => {
                                    return (
                                        // `id` attribute must match the one in the scrollspy
                                        <OrdinoScrollspyItem className="pt-6" id={item.id} key={item.name} index={index} handleOnChange={handleOnChange}>
                                            <>
                                                <h4 className="text-start  mt-2 mb-3"><i className={`me-2 ordino-icon-2 ${item.icon}`}></i> {item.name}</h4>
                                                <item.factory {...{openInNewWindow: props.openInNewWindow}} />
                                            </>
                                        </OrdinoScrollspyItem>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {props.children}
                </>
            }
        </OrdinoScrollspy>
    </>);
}
