import * as React from 'react';
import {connect} from 'react-redux';
import {ActionType, IState} from '../constants';

const SOUND_URL = './beats/';
const Beat = {
    KICK : 'kick.wav',
    HIHAT : 'hihat.wav',
    SNARE : 'snare.wav',
}


class Root extends React.Component<IState,IState> {
    kick: AudioBuffer;
    snare: AudioBuffer;
    hihat: AudioBuffer;
    beats = {
        [Beat.KICK]: this.kick,
        [Beat.SNARE]: this.snare,
        [Beat.HIHAT]: this.hihat,
    }

    render() {
        let { errors } = this.props;
        return (
            <div className="root">
                <div className="svg-wrapper">
                <svg>
                </svg>
                </div>
                <div className="errors">
                    {errors}
                </div>
            </div>
        );
    }

    componentDidMount() {
        let ctx = new AudioContext();
        let dones = 0;
        let l = Object.keys(this.beats);
        l.forEach(beat => {
            loadSound(ctx, beat, (buf: AudioBuffer) => {
                this.beats[beat] = buf;
                if (++dones === l.length) {
                    this.play(ctx);
                }
            })
        })
    }

    play(ctx: AudioContext) {
        // We'll start playing the rhythm 100 milliseconds from "now"
        var startTime = ctx.currentTime + 0.100;
        var tempo = 80; // BPM (beats per minute)
        var eighthNoteTime = (60 / tempo) / 2;

        let hihat = this.beats[Beat.HIHAT];
        let snare = this.beats[Beat.SNARE];
        let kick = this.beats[Beat.KICK];

        // Play 2 bars of the following:
        for (var bar = 0; bar < 2; bar++) {
            var time = startTime + bar * 8 * eighthNoteTime;
            // Play the bass (kick) drum on beats 1, 5
            playSound(ctx, kick, time);
            playSound(ctx, kick, time + 4 * eighthNoteTime);

            // Play the snare drum on beats 3, 7
            playSound(ctx, snare, time + 2 * eighthNoteTime);
            playSound(ctx, snare, time + 6 * eighthNoteTime);

            // Play the hi-hat every eighthh note.
            for (var i = 0; i < 8; ++i) {
                playSound(ctx, hihat, time + i * eighthNoteTime);
            }
        }
    }
}



function playSound(context: AudioContext, buffer: AudioBuffer, time: number) {
    var source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.loop = true;
    source.start(time);
    // source.loopStart/loopEnd = time 
}
function loadSound(context: AudioContext, beat: string, done: (b: AudioBuffer) => void) {
  var request = new XMLHttpRequest();
  request.open('GET', SOUND_URL + beat, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(request.response, (buffer) => {
        done(buffer);
    }, (err) => {
        done(null);
    });
  }
  request.send();
} 

export const App = connect(
    (s: IState) => s
)(Root);
