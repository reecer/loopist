import * as React from 'react';
import {connect} from 'react-redux';
import {IState, IAction, TimingStep} from '../constants';

import '../styles/Ticker.scss';

interface ITickerProps {
  beat: number, // current tick
  timing: number // `Timing`
}

const beats = [1, 2, 3, 4];

export const Ticker = (props: ITickerProps) => {
  let {timing, beat} = props;
  let current = beats.map(b => TimingStep[timing][b].indexOf(beat+1) !== -1);

  return (
      <div className="Ticker">
        {beats.map(b => 
          <span key={b} className={current[b-1] ? "current" : ""} />)}
      </div>
  );
};