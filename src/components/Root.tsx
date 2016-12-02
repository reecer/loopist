import * as React from 'react';
import {connect} from 'react-redux';
import {ActionType, IState} from '../constants';

class Root extends React.Component<IState,IState> {
    render() {
        let { errors } = this.props;
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
    }

    componentDidMount() {

    }
}
export const App = connect(
    (s: IState) => s
)(Root);
