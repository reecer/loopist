import * as React from "react";
import * as ReactDOM from "react-dom";
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import {update} from './reducers';
import {App} from "./components/Root";
import {IState, ActionType} from './constants';

import './styles/global.scss';

declare var window: any;

const DEFAULT_BPM = 120;

const initialState: IState = {
    errors: [],
    loops: [],
    bpm: DEFAULT_BPM,
    metronome: false,
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
