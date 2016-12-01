import * as React from "react";
import * as ReactDOM from "react-dom";
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import {update} from './reducers';
import {App} from "./components/Root";
import {IState, ActionType} from './constants';

declare var window: any;

require('./styles/global.scss');

const initialState: IState = {
    errors: []
}

let store = createStore(
    update,
    initialState,
    window.devToolsExtension && window.devToolsExtension()
);

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('app')
)
