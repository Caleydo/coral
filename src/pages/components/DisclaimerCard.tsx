import * as React from 'react';

export function DisclaimerCard() {
    return (
        <div className="card shadow-sm p-2">
            <div className="card-body">
                <p className="card-text alert alert-warning text-center">
                {/* <div className="alert alert-warning text-center" role="alert"> */}
                <strong>Disclaimer:</strong> This software is for research purposes and non-commercial use only.
                {/* </div> */}
                </p>
            </div>
        </div>
    );
}
