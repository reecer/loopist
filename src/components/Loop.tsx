
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {ActionType, Beat, IState, IAction, ILoop, LoopSource} from '../constants';
import {addedLoop, renameLoop, removeLoop, startRecording, stopRecording} from '../actions';
import {Icon} from 'react-fa';


import '../styles/loop.scss';

interface IWAVLoopProps extends ILoop {
    renameLoop?: (l: ILoop, n: string) => IAction,
    removeLoop?: (l: ILoop) => IAction,
    startRecording?: (l: ILoop) => IAction,
    stopRecording?: (l: ILoop) => IAction,
}
interface ILoopState {
  leftChunks: Float32Array,
  rightChunks: Float32Array,
  chunksLength: number;
  playback: AudioBufferSourceNode;
}

class wavLoop extends React.Component<IWAVLoopProps, ILoopState> {
  constructor(props: IWAVLoopProps, state: ILoopState) {
    super(props, state);
    this.state = {
      leftChunks: new Float32Array(0),
      rightChunks: new Float32Array(0),
      playback: null,
      chunksLength: 0
    }
    props.audio.node.onaudioprocess = this.recv.bind(this)
  }

  render() {
    let p = this.props;
    let {recording, name} = p;
    let {playback, chunksLength} = this.state;
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
          onClick={() => p.removeLoop(p)}/>

        <Icon className="is-recording" 
          name={recording ? "dot-circle-o" : "circle-thin"} />

        <div className="chunks">
          {chunksLength}
        </div>
      </div>
    )
  }

  // Start recording
  startRec() {
    if (this.props.recording) return;
    console.debug('starting recording');

    this.setState({
      leftChunks: new Float32Array(0),
      rightChunks: new Float32Array(0),
      chunksLength: 0,
      playback: null
    }, () => {

      this.props.startRecording(this.props);

      setTimeout(() =>
        this.stopRec(),
        2000
      );
    })
  }

  componentWillUnmount() {
    this.stopRec();
  }

  stopRec() {
    let {recording, audio, stopRecording} = this.props;
    if (!recording) return;
    console.debug('stopping recording');

    stopRecording(this.props);
    audio.node.disconnect();
  }

  recv(ev: AudioProcessingEvent) {
    if (!this.props.recording) return;

    let leftChunks = ev.inputBuffer.getChannelData(0);
    let rightChunks = ev.inputBuffer.getChannelData(1);
    let newLeft = this.state.leftChunks.slice();
    let newRight = this.state.rightChunks.slice();
    let newLen = this.state.chunksLength + leftChunks.length;

    this.setState({
      leftChunks: mergeBuffers([newLeft, leftChunks], newLen),
      rightChunks: mergeBuffers([newRight, rightChunks], newLen),
      chunksLength: newLen,
      playback: null
    });
  }

  // Play what we've recorded
  startPlayback() {
    console.debug('playing back', new Date());
    let {audio, context, buffer} = this.props;
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
    source.start();
    
    // TODO: determin when a loop ends; given bpm
    // source.stop(this.props.context.currentTime + )

    this.setState(Object.assign({}, this.state, {
      playback: source
    }));
  }

  // Stop playing last record
  stopPlayback() {
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
    let {audio, recording} = this.props;
    let source = this.newSource();
    source.connect(audio.gain); // why necessary?
    source.connect(audio.node);
    // audio.node.connect(audio.gain);
    if (source instanceof AudioBufferSourceNode) {
        source.start();
    }
  }
}

export const LoopView = connect(
    (s: IState, p: IWAVLoopProps) => p,
    {
        renameLoop,
        removeLoop,
        startRecording,
        stopRecording
    }
)(wavLoop);


function mergeBuffers(recBuffers: Float32Array[], recLength: number) {
  let result = new Float32Array(recLength);
  let offset = 0;
  for (let i = 0; i < recBuffers.length; i++) {
      result.set(recBuffers[i], offset);
      offset += recBuffers[i].length;
  }
  return result;
}
