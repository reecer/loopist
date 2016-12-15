import * as React from 'react';
import {connect} from 'react-redux';
import {IState, IAction} from '../constants';

import '../styles/Ticker.scss';

interface ITickerProps {
  beat: number,
}

const beats = [0,1,2,3];

export const Ticker = (props: ITickerProps) => {
  let current = beats.map(i => props.beat / beats.length == i);
  return (
      <div className="Ticker">
        {beats.map(i => 
          <span key={i} className={current[i] ? "current" : ""} />)}
      </div>
  );
};