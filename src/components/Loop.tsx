
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {Ticker} from './Ticker';
import {ActionType, Beat, IState, IAction, ILoop, LoopSource, InputBuffer, SourceNode, Timing} from '../constants';
import {renameLoop, removeLoop, updateMeasures} from '../actions/loop';
import {Icon} from 'react-fa';

import '../styles/loop.scss';

const stopTick = {
  [Timing.WHOLE]: 0,
  [Timing.HALF]: 8,
  [Timing.QUARTER]: 4,
  // [Timing.EIGTH]: 2,
  // [Timing.SIXTEENTH]: 1,
}

interface IQueueItem {
  work: () => void;
}

// A Loop's state, plus these internal props
interface ILoopProps extends ILoop {
  bpm: number;
  worker: Worker;
  updateMeasures?: (l: ILoop, m: number) => IAction,
  renameLoop?: (l: ILoop, n: string) => IAction,
  removeLoop?: (l: ILoop) => IAction,
}


// stateful data that is NOT shared globally (internal state)
interface ILoopState {
  leftChunks: Float32Array,
  rightChunks: Float32Array,
  chunksLength: number;
  playback: AudioBuffer;
  currentTick: number; // the "beat" we at
  recording: boolean;
  playing: boolean;
}


/*
  A loop sourced from either raw input (getUserMedia) OR a predefined *.wav
*/
class Loop extends React.Component<ILoopProps, ILoopState> {
  queue: IQueueItem[] = [];
  startedRec = false
  playbackSource: AudioBufferSourceNode;

  constructor(props: ILoopProps, state: ILoopState) {
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
      recording: false,
      playing: false
    }
  }

  componentWillUnmount() {
    this.props.worker.removeEventListener('message', this.tick);
    this.stopRec();
  }

  render() {
    let p = this.props;
    let {name, timing} = p;
    let {playing, playback, chunksLength, recording, currentTick} = this.state;
    let wavFile = this.props.buffer instanceof AudioBuffer;

    return (
      <div className="loop">
        <div className="border" />
        <div className="info">
          <Ticker beat={currentTick} timing={timing} />

          {/* TODO: make editable */}
          <input className="name" type="text" 
            defaultValue={name} />

          <span className={"is-recording " + recording} /> 

          <label className="measures">Measures
          <input type="number" 
            onChange={(e) => this.props.updateMeasures(this.props, parseInt(e.currentTarget.value))}
            value={timing.toString()} />
          </label>

          <div className="chunks">
            {chunksLength}
          </div>
        </div>

        <div className="actions">
          <span className="record" 
            title="Start recording"
            disabled={recording} 
            onClick={() => this.startRec()}>
            <Icon name="microphone" />
          </span> 

          {wavFile &&
          <span className="play" 
            title="Play sound"
            onClick={() => this.playSound()}>
            <Icon name="play" />
          </span> }

          {playback && 
          <span className="playback" 
            title="Loop recording"
            onClick={() => playing ? this.stopPlayback() : this.startPlayback()}> 
            <Icon name={playing ?"stop" : "repeat"} />
          </span> }

          <span className="remove" 
            title="Remove loop"
            onClick={this.remove}>
            <Icon name="trash" />
          </span> 
        </div>
      </div>
    )
  }

  // Recv tick from timer worker
  tick(ev: MessageEvent) {
    let currentTick = ev.data;
    this.setState(Object.assign({}, this.state, {
      currentTick
    }));

    // determine stopping point
    let st = stopTick[this.props.timing];
    if (currentTick == st && this.state.recording && this.startedRec) {
      this.stopRec();
      this.startPlayback(); // immediately start playing

      // cleanup disconnects
      if (this.queue.length > 0) {
        this.queue.forEach(q => q.work());
        this.queue = [];
      }
    }

    // determine starting point
    if (currentTick == 0) {
        this.startedRec = true;
        let source = this.newSource();
        if (source instanceof MediaStreamAudioSourceNode) {
          source.connect(this.props.audio.node);
          // disconnect when finished
          this.queue.push({work:() => source.disconnect()});
        }
    }
  }

  // Recv event from onaudioprocess
  recv(ev: AudioProcessingEvent) {
    let {recording, currentTick} = this.state;
    if (!recording || !this.startedRec) return;

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

  // Remove this loop
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
    this.startedRec = false;
    let {audio} = this.props;

    if (this.state.playing) {
      this.stopPlayback();
    }

    audio.node.connect(audio.gain);

    this.setState(Object.assign({}, this.state, {
      leftChunks: new Float32Array(0),
      rightChunks: new Float32Array(0),
      chunksLength: 0,
      playback: null,
      playing: false,
      recording: true
    }))
  }

  // Stop recording and copy to playback
  stopRec() {
    let {recording} = this.state;
    if (!recording) return;
    this.startedRec = false;

    let {audio} = this.props;

    audio.node.disconnect();
    this.setState(Object.assign({}, this.state, {
      recording: false,
      playback: this.copyPlayback()
    }))
  }

  // Play what we've recorded
  startPlayback() {
    let {playback} = this.state;
    let {audio} = this.props;
    let source = this.newSource(playback);
    if (!(source instanceof AudioBufferSourceNode)) return;

    console.log("playback len", source.buffer.duration);

    this.playbackSource = source;
    source.loop = true;
    source.connect(audio.gain);

    // play at beginning of measure
    this.pushQueue(source.start.bind(source))

    //  update playback so we know we're playing
    this.setState(Object.assign({}, this.state, {
      playing: true
    }));
  }

  // Stop playing last record
  stopPlayback() {
    if (!this.state.playback || !this.state.playing) return;

    this.playbackSource.stop();
    // this.state.playback.disconnect();
    this.setState(Object.assign({}, this.state, {
      playing: false
    }));
  }
    
  // copy whats in recording buffer and return
  copyPlayback() : AudioBuffer {
    let {audio, context, bpm} = this.props;
    let {chunksLength, leftChunks, rightChunks} = this.state;
    let buf = context.createBuffer(2, chunksLength, context.sampleRate);

    buf.copyToChannel(leftChunks, 0);
    buf.copyToChannel(rightChunks, 1);
    return buf;
  }

  newSource(buf?: InputBuffer) : SourceNode {
    let {buffer, context} = this.props;
    let source: SourceNode;

    if (!buf) {
      buf = buffer;
    }
    
    if (buf instanceof AudioBuffer) {
      source = context.createBufferSource();
      if (source instanceof AudioBufferSourceNode) {
        source.buffer = buf;
      }
    } else {
      source = context.createMediaStreamSource(buf);
    } 

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
    (s: IState, p: ILoopProps) => p,
    {
        renameLoop,
        removeLoop,
        updateMeasures
    }
)(Loop);
