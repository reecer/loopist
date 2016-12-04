import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {ActionType, Beat, IState, IAction, ILoop, InputSource, Timing, BeatMap, InputBuffer} from '../constants';
import {addedLoop} from '../actions';
import {LoopView} from './Loop';

const SOUND_URL = './beats/';
const DEFAULT_LOOPNAME = 'Loop';

interface IRootProps extends IState {
    addedLoop?: (l: ILoop) => void
}

class Root extends React.Component<IRootProps, IState> {
    context: AudioContext
    beats : BeatMap = {
        [Beat.KICK]: null,
        [Beat.SNARE]: null,
        [Beat.HIHAT]: null,
    };

    constructor(props: IRootProps, state: IState) {
        super(props, props);
        this.addKick = this.addLoop.bind(this, Beat.KICK);
        console.debug('root constructor', this.context);
    }

    render() {
        console.debug("rendering top-level root");Object.assign
        let { errors, loops } = this.props;
        return (
            <div className="root">
                <div className="tools">
                    <input value="Add Kick" type="button" onClick={this.addKick} />
                </div>
                <div className="loops">
                    {loops.map(l => 
                        <LoopView key={l.uid} {...l} />
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
        this.setState(newProps);
    }
    
    componentDidMount() {
        this.context = new AudioContext();
    }

    addKick(){}
    addLoop(src: InputSource) {
        let l: ILoop = {
            uid: Date.now(),
            context: this.context,
            resolution: Timing.QUARTER,
            name: DEFAULT_LOOPNAME,
            recording: false,
            buffer: null,
            audio: {
                node: this.context.createScriptProcessor(),
                gain: this.context.createGain(),
            },
        }
        l.audio.gain.connect(this.context.destination);
        l.audio.node.connect(l.audio.gain);

        const whenDone = (buf: InputBuffer) => {
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
            navigator.getUserMedia(
                {audio: true},
                whenDone,
                (err: MediaStreamError) => {
                    console.error(err);
                    alert("Error getting media stream");
                }
            );
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
        'addedLoop': addedLoop
    }
)(Root);