import {BeatMap, SourceType, LoopSource, InputBuffer, InputSource} from './constants';

const SOUND_URL = './beats/';
const Beat = {
    KICK : 'kick.wav',
    HIHAT : 'hihat.wav',
    SNARE : 'snare.wav',
}

const Timing = {
    QUAD: 4,
    DOUBLE: 2,
    WHOLE: 1,
    HALF: 1/2,
    QUARTER: 1/4,
    EIGTH: 1/8,
    SIXTEENTH: 1/16,
}

class Loop {
    chunks: Float32Array[]; 
    bufferLength: number = 0;

    constructor(public source: LoopSource, public timing: number) {
        source.node.onaudioprocess = (ev: AudioProcessingEvent) => this.recv(ev);
    }


    recv(ev: AudioProcessingEvent) {
        let chunk = ev.inputBuffer.getChannelData(0);
        this.chunks.push(chunk);
        this.bufferLength += chunk.length;
    }
    
    start(time: number) {
        // TODO -- provide a window of time for capturing audio;
    }
}

class Controller {
    context: AudioContext;
    bpm: number;
    loops: Loop[];
    beats : BeatMap = {
        [Beat.KICK]: null,
        [Beat.SNARE]: null,
        [Beat.HIHAT]: null,
    };

    constructor() {
        this.context = new AudioContext();
    }

    sourceFrom(buf: InputBuffer) : LoopSource {
        let src: LoopSource;

        if (buf instanceof AudioBuffer) {
            let node = this.context.createBufferSource();
            node.buffer = buf;
            src.source = node;
        } else if (buf instanceof MediaStream) {
            src.source = this.context.createMediaStreamSource(buf);
        }

        // TODO: try 2 input/output channels
        src.node = this.context.createScriptProcessor(0, 1, 1);

        let gain = this.context.createGain();
        src.source.connect(gain);
        gain.connect(this.context.destination);
        return src;
    }

    addLoop(src : InputSource, timing: number) {
        const whenDone = (buf: InputBuffer) => {
            let audioSrc = this.sourceFrom(buf);
            this.loops.push(new Loop(audioSrc, timing));
        }

        if (src instanceof String) {
            if (this.beats[src] === null) {
                this.loadSound(src, whenDone);
            } else {
                whenDone(this.beats[src]);
            }
        } else {
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
        var request = new XMLHttpRequest();
        request.open('GET', SOUND_URL + beat, true);
        request.responseType = 'arraybuffer';

        request.onload = () => {
            this.context.decodeAudioData(request.response, (buffer) => {
                this.beats[beat] = buffer;
                done(buffer);
            }, (err) => {
                alert('error loading beat: ' + beat);
            });
        }
        request.send();
    } 
}
