
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {ActionType, Beat, IState, IAction, ILoop, LoopSource} from '../constants';
import {addedLoop, renameLoop, removeLoop} from '../actions';
import {Icon} from 'react-fa';

import '../styles/loop.scss';

interface IQueueItem {
  work: () => void;
}

interface IWAVLoopProps extends ILoop {
  bpm: number;
  worker: Worker;
  renameLoop?: (l: ILoop, n: string) => IAction,
  removeLoop?: (l: ILoop) => IAction,
}
interface ILoopState {
  leftChunks: Float32Array,
  rightChunks: Float32Array,
  chunksLength: number;
  playback: AudioBufferSourceNode;
  currentTick: number; // the "beat" we at
  recording: boolean;
}

class wavLoop extends React.Component<IWAVLoopProps, ILoopState> {
  queue: IQueueItem[] = [];
  startedRec = false

  constructor(props: IWAVLoopProps, state: ILoopState) {
    super(props, state);
    this.recv = this.recv.bind(this);
    this.tick = this.tick.bind(this);
    this.remove = this.remove.bind(this);

    props.audio.node.onaudioprocess = this.recv;
    props.worker.addEventListener('message', this.tick);

    this.state = {
      leftChunks: new Float32Array(0),
      rightChunks: new Float32Array(0),
      playback: null,
      chunksLength: 0,
      currentTick: 0,
      recording: false
    }
  }

  componentWillUnmount() {
    this.props.worker.removeEventListener('message', this.tick);
    this.stopRec();
  }

  render() {
    let p = this.props;
    let {name} = p;
    let {playback, chunksLength, recording, currentTick} = this.state;
    let playing = playback !== null;

    return (
      <div className="loop">
        <input className="name" type="text" 
          defaultValue={name} />

        <input className="record" type="button" value="Record" 
          disabled={recording}
          onClick={() => this.startRec()} />

        <input className="play" type="button" value="Play" 
          onClick={() => this.playSound()}/>

        <input className="playback" type="button" 
          value={playing ? "Stop" : "Playback"}
          onClick={() => playing ? this.stopPlayback() : this.startPlayback()}/>

        <input className="remove" type="button" value="Remove" 
          onClick={this.remove}/>

        <Icon className="is-recording" 
          name={recording ? "dot-circle-o" : "circle-thin"} />

        <div className="chunks">
          {chunksLength + ', ' + currentTick}
        </div>
      </div>
    )
  }

  tick(ev: MessageEvent) {
    let currentTick = ev.data;
    this.setState(Object.assign({}, this.state, {
      currentTick
    }));

    if (currentTick == 0) {
      if(this.startedRec) {
        this.stopRec();
      } else {
        this.startedRec = true;
      }
      if (this.queue.length > 0) {
        this.queue.forEach(q => q.work());
        this.queue = [];
      }
    }
  }

  remove() {
    if (this.state.recording) {
      this.stopRec();
    }
    if (this.state.playback) {
      this.stopPlayback();
    }
    this.props.removeLoop(this.props);
  }

  pushQueue(fn: () => void) {
      this.queue.push({
        work: fn
      })
  }

  // Start recording
  startRec() {
    if (this.state.recording) return;
    console.debug('starting recording');
    this.startedRec = false;

    this.setState(Object.assign({}, this.state, {
      leftChunks: new Float32Array(0),
      rightChunks: new Float32Array(0),
      chunksLength: 0,
      playback: null,
      recording: true
    }))
  }

  stopRec() {
    let {recording} = this.state;
    if (!recording) return;
    console.debug('stopping recording');

    let {audio} = this.props;

    audio.node.disconnect();
    this.setState(Object.assign({}, this.state, {
      recording: false
    }))
  }

  recv(ev: AudioProcessingEvent) {
    let {recording, currentTick} = this.state;
    if (!recording) return;
    if (!this.startedRec && currentTick != 0) return;
    // this.startedRec = true;

    let leftChunks = ev.inputBuffer.getChannelData(0);
    let rightChunks = ev.inputBuffer.getChannelData(1);
    let newLeft = this.state.leftChunks.slice();
    let newRight = this.state.rightChunks.slice();
    let newLen = this.state.chunksLength + leftChunks.length;

    this.setState(Object.assign({}, this.state, {
      leftChunks: mergeBuffers([newLeft, leftChunks], newLen),
      rightChunks: mergeBuffers([newRight, rightChunks], newLen),
      chunksLength: newLen,
    }));
  }

  // Play what we've recorded
  startPlayback() {
    console.debug('playing back');
    let {audio, context, buffer, bpm} = this.props;
    let {chunksLength, leftChunks, rightChunks} = this.state;
    let buf: AudioBuffer;

    if (buffer instanceof AudioBuffer) {
      buf = context.createBuffer(2, chunksLength, buffer.sampleRate);
    } else return alert('no buffer?');

    buf.copyToChannel(leftChunks, 0);
    buf.copyToChannel(rightChunks, 1);

    let source = context.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    source.connect(audio.gain);

    console.log("playback len", source.buffer.duration);

    // play at beginning of measure
    this.pushQueue(() => source.start())

    //  update playback so we know we're playing
    this.setState(Object.assign({}, this.state, {
      playback: source,
    }));
  }

  // Stop playing last record
  stopPlayback() {
    if (!this.state.playback) return;

    this.state.playback.stop();
    this.state.playback.disconnect();
    this.setState(Object.assign({}, this.state, {
      playback: null
    }));
  }
    
  newSource() : AudioBufferSourceNode {
    let {buffer} = this.props;
    let source = this.props.context.createBufferSource();
    
    if (buffer instanceof AudioBuffer) {
      source.buffer = buffer;
    } else alert('wrong buffer type?')

    return source;
  }

  playSound() {
    let {audio} = this.props;
    let source = this.newSource();
    source.connect(audio.gain); // why necessary?
    source.connect(audio.node);
    // audio.node.connect(audio.gain);
    if (source instanceof AudioBufferSourceNode) {
        source.start();
    }
  }
}

function mergeBuffers(recBuffers: Float32Array[], recLength: number) {
  let result = new Float32Array(recLength);
  let offset = 0;
  for (let i = 0; i < recBuffers.length; i++) {
      result.set(recBuffers[i], offset);
      offset += recBuffers[i].length;
  }
  return result;
}



export const LoopView = connect(
    (s: IState, p: IWAVLoopProps) => p,
    {
        renameLoop,
        removeLoop,
    }
)(wavLoop);
