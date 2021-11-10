import * as React from 'react';

interface IFeatureCardProps {
    image?: {
        file: string;
        altText: string;
    };
    title: string;
    config: {
        numbAttr: number;
        attribute: string;
    };
    /**
     * Add card text as children
     */
    children?: React.ReactNode;
}

export function FeatureCard({image, title, config, children}: IFeatureCardProps) {
    let htmlImage: React.ReactNode = '';
    // only assigning an image element, if image is not null
    if(image) {
        htmlImage = <img className="img-fluid mt-3 me-3 img-thumbnail position-absolute top-0 end-0" src={image.file} alt={image.altText} />;
    }
    return (
        <div className="col mt-4">
            <div className="card shadow-sm h-100">
                <div className="card-body p-3">
                    <h5 className="card-title mb-4">{title}</h5>
                    <p>
                        <b>Number of Attribtues:</b> {config.numbAttr}
                        <br />
                        <b>Type of Attribtues:</b> {config.attribute}
                    </p>
                    {htmlImage}
                    {children}
                </div>
            </div>
        </div>
    );
}
