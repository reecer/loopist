import * as React from 'react';
import {connect} from 'react-redux';
import {Ticker} from './Ticker';
import {IState, IAction} from '../constants';
import {muteMetronome} from '../actions';

import '../styles/Metronome.scss';

interface IMetronomeProps {
  context: AudioContext, // to create a audiable noise
  worker: Worker,        // our "clock"
  on: boolean,           // enable audio?
  muteMetronome?: (m: boolean) => IAction
}

interface IMetronomeState {
  beat: number
}

class metronome extends React.Component<IMetronomeProps, IMetronomeState> {
  constructor(props: IMetronomeProps, state: IMetronomeState) {
    super(props, state);

    this.state =  {
      beat: 0
    };
  }

  render() {
    let {context, on, muteMetronome} = this.props;
    let {beat} = this.state;
    let toggle = () => muteMetronome(!on);

    if (on && beat % 4 === 0) {
        var osc = context.createOscillator();
        osc.connect(context.destination);
        osc.frequency.value = 85;
        if (beat === 12) {
          osc.frequency.value = 100;
        }
        osc.start();
        osc.stop(context.currentTime + .1);
    }

    return (
        <div className={"Metronome " + (on ? '' : 'muted')} onClick={toggle}>
          <input type="checkbox" checked={on}  />
          <Ticker beat={beat} timing={1} />
        </div>
    );
  }

  componentDidMount() {
    this.props.worker.addEventListener('message', (ev: MessageEvent) => {
        this.setState({beat: ev.data});
    })
  }
}

export const Metronome = connect(
    (s: IState, p: IMetronomeProps) => p,
    { muteMetronome }
)(metronome);