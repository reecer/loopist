import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {Icon} from 'react-fa';
import {ActionType, Beat, IState, IAction, ILoop, InputSource, Timing, InputBuffer} from '../constants';
import {globalPause, updateBPM} from '../actions';
import {addedLoop} from '../actions/loop';
import {LoopView} from './Loop';
import {Metronome} from './Metronome';

const SOUND_URL = './beats/';
const DEFAULT_LOOPNAME = 'Loop';
const WORKER_URL = './src/worker.js';
const BPM_THROTTLE = 200; // ms throttle for bpm update

// Map of beat names to their buffers
type BeatMap = ({[s: string] : AudioBuffer});

// Input click callback
type LoopFn = (e: React.MouseEvent<HTMLInputElement>) => void

interface IRootProps extends IState {
    addedLoop?: (l: ILoop) => void
    updateBPM?: (n: number) => void
}

class Root extends React.Component<IRootProps, void> {
    context: AudioContext
    worker: Worker
    bpmThrottle: number // timeout to clear
    beats : BeatMap = {
        [Beat.KICK]: null,
        [Beat.SNARE]: null,
        [Beat.HIHAT]: null,
    }
    addInput: LoopFn
    addKick: LoopFn
    addSnare: LoopFn
    addHihat: LoopFn

    constructor(props: IRootProps) {
        super(props, props);
        this.worker = new Worker(WORKER_URL);
        this.bpmChange = this.bpmChange.bind(this);
        this.addInput = this.addLoop.bind(this);
        this.addKick = this.addLoop.bind(this, Beat.KICK);
        this.addSnare = this.addLoop.bind(this, Beat.SNARE);
        this.addHihat = this.addLoop.bind(this, Beat.HIHAT);
    }

    render() {
        console.debug("rendering top-level root");
        let { errors, loops, bpm, metronome } = this.props;
        return (
            <div className="root">
                <div className="tools">
                    <Metronome worker={this.worker} on={metronome} context={this.context} />

                    <label>BPM
                        <input className="bpm" type="number" 
                            onChange={this.bpmChange}
                            value={bpm.toString()} />
                    </label>
                    <input value="Input" type="button" 
                        onClick={this.addInput} />
                    <input value="Kick" type="button" 
                        onClick={this.addKick} />
                    <input value="Snare" type="button" 
                        onClick={this.addSnare} />
                    <input value="Hihat" type="button" 
                        onClick={this.addHihat} />
                </div>
                <div className="loops">
                    {loops.map(l => 
                        <LoopView 
                            key={l.uid} 
                            bpm={bpm}
                            worker={this.worker}
                            {...l}  />
                    )}
                </div>
                <div className="errors">
                    {errors}
                </div>
            </div>
        );
    }

    componentWillReceiveProps(newProps: IRootProps) {
        // Update worker beat ticks if BPM changed
        if (this.props.bpm != newProps.bpm) {
            if (this.bpmThrottle) {
                clearTimeout(this.bpmThrottle);
            }
            this.bpmThrottle = setTimeout(() => this.startTimer(newProps.bpm), 200);
        }
    }
    
    componentDidMount() {
        // WHY is this an empty object when in the constructor?!!
        this.context = new AudioContext();
        this.startTimer();
    }

    startTimer(bpm?: number) {
        this.worker.postMessage(bpm || this.props.bpm);
    }

    bpmChange(ev: React.FormEvent<HTMLInputElement>) {
        this.props.updateBPM(parseInt(ev.currentTarget.value));
    }

    addLoop(src: InputSource) {
        let l: ILoop = {
            uid: Date.now(),
            context: this.context,
            timing: Timing.WHOLE,
            name: DEFAULT_LOOPNAME,
            buffer: null,
            audio: {
                node: this.context.createScriptProcessor(),
                gain: this.context.createGain(),
            },
        }
        l.audio.gain.connect(this.context.destination);

        // Called after loading InputSource
        const whenDone = (buf: InputBuffer) => {
            l.buffer = buf;
            this.props.addedLoop(l);
        };

        // Load buffer via wav
        if (typeof(src) === 'string') {
            // Hasn't been loaded yet
            if (this.beats[src] === null) {
                this.loadSound(src, whenDone);

            // Re-use existing load
            } else {
                whenDone(this.beats[src]);
            }
        // Load stream via mediaDevices
        } else {
            // TODO: polyfilly fallybacky
            navigator.mediaDevices.getUserMedia({audio: true})
                .then(whenDone)
        }
    
    }

    // Load a pre-defined audio WAV to use as an `InputBuffer`
    loadSound(beat: string, done: (b: AudioBuffer) => void) {
        var request = new XMLHttpRequest();
        request.open('GET', SOUND_URL + beat, true);
        request.responseType = 'arraybuffer';

        request.onload = () => {
            this.context.decodeAudioData(request.response, (buffer: AudioBuffer) => {
                this.beats[beat] = buffer;
                done(buffer);
            }, (err: DOMException) => {
                alert('error loading beat: ' + beat);
            });
        }
        request.send();
    } 
}

export const App = connect(
    (s: IState) => s,
    {
        addedLoop,
        globalPause,
        updateBPM
    }
)(Root);