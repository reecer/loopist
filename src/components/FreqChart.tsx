import * as React from 'react';
import {connect} from 'react-redux';
import {Ticker} from './Ticker';
import {IState, IAction, SourceNode} from '../constants';

import '../styles/FreqChart.scss';

const HISTORY_LEN = 1000;
const SAMPLE_SIZE = 256;

interface IFreqProps {
  source: SourceNode
  context: AudioContext
}

interface IFreqState {
  data: Uint8Array
  history: Uint8Array[] // rolling history
}

class freqChart extends React.Component<IFreqProps, IFreqState> {
  analyser: AnalyserNode;
  animationFrame: number; // requestAnimationFrame return

  constructor(props: IFreqProps, state: IFreqState) {
    super(props, state);
    this.analyser = props.context.createAnalyser();
    this.analyser.fftSize = SAMPLE_SIZE;

    props.source.connect(this.analyser);

    this.state =  {
      data: new Uint8Array(this.analyser.frequencyBinCount),
      history: []
    };
  }

  render() {
    let bars = Array.prototype.map.call(this.state.data, (d: number, i: number) => {
      let st = {height: d + 'px', display: 'inline'};
      if (d === 0) {
        st.display = 'none';
      }
      return <span key={i} className="bar" style={st} /> 
    })
    let bars2 = bars.slice();
    bars.reverse();
    return (
      <div className="FreqChart">
        {bars}
        {bars2}
      </div>
    );
  }

  componentDidMount() {
    this.drawFreqs();
  }

  componentWillUnmount() {
    this.props.source.disconnect();
    cancelAnimationFrame(this.animationFrame);
  }

  // Set the data for the frequency chart
  drawFreqs() {
    this.animationFrame = requestAnimationFrame(() => this.drawFreqs());
    let newData = this.state.data.slice();
    this.analyser.getByteFrequencyData(newData);
    this.setState({
      data: newData,
      history: [] // TODO
    })
  }
}

export const FreqChart = connect(
    (s: IState, p: IFreqProps) => p,
    // { muteMetronome }
)(freqChart);