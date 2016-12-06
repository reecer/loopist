import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {Icon} from 'react-fa';
import {ActionType, Beat, IState, IAction, ILoop, InputSource, Timing, BeatMap, InputBuffer} from '../constants';
import {addedLoop, muteMetronome, globalPause} from '../actions';
import {LoopView} from './Loop';

const SOUND_URL = './beats/';
const DEFAULT_LOOPNAME = 'Loop';

interface IRootProps extends IState {
    addedLoop?: (l: ILoop) => void
    muteMetronome?: (m: boolean) => void
}

class Root extends React.Component<IRootProps, void> {
    context: AudioContext
    worker: Worker
    playQueued: boolean
    beats : BeatMap = {
        [Beat.KICK]: null,
        [Beat.SNARE]: null,
        [Beat.HIHAT]: null,
    }

    constructor(props: IRootProps) {
        super(props, props);
        this.addKick = this.addLoop.bind(this, Beat.KICK);
        this.addSnare = this.addLoop.bind(this, Beat.SNARE);
        this.addHihat = this.addLoop.bind(this, Beat.HIHAT);
        this.addInput = this.addLoop.bind(this);
        this.metronome = this.metronome.bind(this);
    }

    render() {
        console.debug("rendering top-level root");
        let { errors, loops, bpm, metronome } = this.props;
        return (
            <div className="root">
                <div className="tools">
                    <label className={"metronome " + (metronome ? '' : 'muted')} onChange={this.metronome}>
                        Metronome
                        <input type="checkbox" checked={this.props.metronome}  />
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
                            ref={l.uid.toString()} 
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
        console.debug('receiving new props', this.props, newProps);
    }
    
    componentDidMount() {
        this.context = new AudioContext();
        this.worker = new Worker('./src/worker.js');
        this.worker.addEventListener('message', (ev: MessageEvent) => {
            if (this.props.metronome == false) return;
            let tick = ev.data;
            if (tick % 4 === 0) {
                var osc = this.context.createOscillator();
                osc.connect( this.context.destination );
                osc.frequency.value = 100;
                osc.start();
                osc.stop(this.context.currentTime + .1);
            }
        })
        this.startTimer();
    }

    startTimer() {
        this.worker.postMessage(this.props.bpm);
    }

    metronome(){
        this.props.muteMetronome(!this.props.metronome);
    }
    addInput(){}
    addKick(){}
    addSnare(){}
    addHihat(){}
    addLoop(src: InputSource) {
        let l: ILoop = {
            uid: Date.now(),
            context: this.context,
            measures: 1,
            name: DEFAULT_LOOPNAME,
            buffer: null,
            audio: {
                node: this.context.createScriptProcessor(),
                gain: this.context.createGain(),
            },
        }
        l.audio.gain.connect(this.context.destination);

        const whenDone = (buf: InputBuffer) => {
            console.log(buf);
            l.buffer = buf;
            this.props.addedLoop(l);
        };

        // Load buffer
        if (typeof(src) === 'string') {
            // via wav
            if (this.beats[src] === null) {
                this.loadSound(src, whenDone);
            } else {
                whenDone(this.beats[src]);
            }
        } else {
            // via input
            navigator.mediaDevices.getUserMedia({audio: true})
                .then(whenDone)
        }
    
    }

    loadSound(beat: string, done: (b: AudioBuffer) => void) {
        console.debug('loading sound', beat, this.context);

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
        muteMetronome,
        globalPause
    }
)(Root);