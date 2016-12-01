import * as React from 'react';
import {connect} from 'react-redux';
import {ActionType, IState} from '../constants';

const Root = (props: IState) => {
    let { errors } = props;
    return (
        <div className="root">
            <div className="svg-wrapper">
            <svg>
            </svg>
            </div>
            <div className="errors">
                {errors}
            </div>
        </div>
    );
};

export const App = connect(
    (s: IState) => s
)(Root);
