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
export declare function FeatureCard({ image, title, config, children }: IFeatureCardProps): JSX.Element;
export {};
