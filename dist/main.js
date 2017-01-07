webpackJsonp([0],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const React = __webpack_require__(1);
	const ReactDOM = __webpack_require__(32);
	const redux_1 = __webpack_require__(178);
	const react_redux_1 = __webpack_require__(199);
	const reducers_1 = __webpack_require__(208);
	const Root_1 = __webpack_require__(210);
	__webpack_require__(238);
	const DEFAULT_BPM = 60;
	const initialState = {
	    errors: [],
	    loops: [],
	    bpm: DEFAULT_BPM,
	    metronome: false,
	};
	let store = redux_1.createStore(reducers_1.update, initialState, window.devToolsExtension && window.devToolsExtension());
	ReactDOM.render(React.createElement(react_redux_1.Provider, {store: store}, 
	    React.createElement(Root_1.App, null)
	), document.getElementById('app'));


/***/ },

/***/ 208:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const constants_1 = __webpack_require__(209);
	const validTimings = [1, 2, 4]; //,8,16];
	function update(state, action) {
	    switch (action.type) {
	        case constants_1.ActionType.Error:
	            return Object.assign({}, state, {
	                errors: state.errors.concat(action.data)
	            });
	        case constants_1.ActionType.GlobalPause:
	            return Object.assign({}, state, {
	                paused: action.data,
	            });
	        case constants_1.ActionType.MuteMetronome:
	            return Object.assign({}, state, {
	                metronome: action.data,
	            });
	        case constants_1.ActionType.UpdateBPM:
	            return Object.assign({}, state, {
	                bpm: action.data,
	            });
	        case constants_1.ActionType.AddedLoop:
	            action.data.uid = Date.now();
	            return Object.assign({}, state, {
	                loops: state.loops.concat(action.data)
	            });
	        case constants_1.ActionType.RmLoop:
	            return Object.assign({}, state, {
	                loops: state.loops.filter(l => l.uid != action.data.uid)
	            });
	        case constants_1.ActionType.UpdateLpTiming:
	            var { loop, timing } = action.data;
	            if (validTimings.indexOf(timing) === -1) {
	                return state;
	            }
	            return Object.assign({}, state, {
	                loops: state.loops.map(l => {
	                    if (l.uid != action.data.uid) {
	                        l.timing = timing;
	                    }
	                    return l;
	                })
	            });
	        case constants_1.ActionType.RenameLoop:
	            var { loop, name } = action.data;
	            return Object.assign({}, state, {
	                loops: state.loops.map(l => {
	                    if (l.uid == loop.uid) {
	                        l.name = name;
	                    }
	                    return l;
	                })
	            });
	        default:
	            return state;
	    }
	}
	exports.update = update;


/***/ },

/***/ 209:
/***/ function(module, exports) {

	"use strict";
	// Actions that affect the top-level IState
	(function (ActionType) {
	    // Non-user originated
	    ActionType[ActionType["Error"] = "error"] = "Error";
	    // Root-level
	    ActionType[ActionType["GlobalPause"] = "global_pause"] = "GlobalPause";
	    ActionType[ActionType["MuteMetronome"] = "mute_metronome"] = "MuteMetronome";
	    ActionType[ActionType["UpdateBPM"] = "update_bpm"] = "UpdateBPM";
	    ActionType[ActionType["AddedLoop"] = "added_loop"] = "AddedLoop";
	    // Loop-level
	    ActionType[ActionType["RmLoop"] = "remove_loop"] = "RmLoop";
	    ActionType[ActionType["RenameLoop"] = "rename_loop"] = "RenameLoop";
	    ActionType[ActionType["UpdateLpTiming"] = "update_loop_timing"] = "UpdateLpTiming";
	    ActionType[ActionType["StartRecord"] = "start_record"] = "StartRecord";
	    ActionType[ActionType["StopRecord"] = "stop_record"] = "StopRecord";
	})(exports.ActionType || (exports.ActionType = {}));
	var ActionType = exports.ActionType;
	exports.Beat = {
	    KICK: 'kick.wav',
	    HIHAT: 'hihat.wav',
	    SNARE: 'snare.wav',
	};
	exports.Timing = {
	    WHOLE: 1,
	    HALF: 2,
	    QUARTER: 4,
	};
	exports.TimingStep = {
	    [exports.Timing.WHOLE]: {
	        1: [1],
	        2: [5],
	        3: [9],
	        4: [13]
	    },
	    [exports.Timing.HALF]: {
	        1: [1, 9],
	        2: [3, 11],
	        3: [5, 13],
	        4: [7, 15]
	    },
	    [exports.Timing.QUARTER]: {
	        1: [1, 5, 9, 13],
	        2: [2, 6, 10, 14],
	        3: [3, 7, 11, 15],
	        4: [4, 8, 12, 16]
	    },
	};


/***/ },

/***/ 210:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var __assign = (this && this.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	const React = __webpack_require__(1);
	const react_redux_1 = __webpack_require__(199);
	const constants_1 = __webpack_require__(209);
	const actions_1 = __webpack_require__(211);
	const loop_1 = __webpack_require__(212);
	const Loop_1 = __webpack_require__(213);
	const Metronome_1 = __webpack_require__(232);
	const FreqChart_1 = __webpack_require__(235);
	const SOUND_URL = './beats/';
	const DEFAULT_LOOPNAME = 'Loop';
	const WORKER_URL = './src/worker.js';
	const BPM_THROTTLE = 200; // ms throttle for bpm update
	class Root extends React.Component {
	    constructor(props) {
	        super(props, props);
	        this.beats = {
	            [constants_1.Beat.KICK]: null,
	            [constants_1.Beat.SNARE]: null,
	            [constants_1.Beat.HIHAT]: null,
	        };
	        this.worker = new Worker(WORKER_URL);
	        this.mute = this.mute.bind(this);
	        this.bpmChange = this.bpmChange.bind(this);
	        this.addInput = this.addLoop.bind(this);
	        this.addKick = this.addLoop.bind(this, constants_1.Beat.KICK);
	        this.addSnare = this.addLoop.bind(this, constants_1.Beat.SNARE);
	        this.addHihat = this.addLoop.bind(this, constants_1.Beat.HIHAT);
	        this.state = {
	            hasInput: false,
	            muteInput: true
	        };
	    }
	    render() {
	        console.debug("rendering top-level root");
	        let { errors, loops, bpm, metronome } = this.props;
	        return (React.createElement("div", {className: "root"}, 
	            React.createElement("div", {className: "tools"}, 
	                React.createElement(Metronome_1.Metronome, {worker: this.worker, on: metronome, context: this.context}), 
	                this.state.hasInput &&
	                    React.createElement("div", {className: "freq" + (this.state.muteInput ? ' muted' : ''), onClick: this.mute}, 
	                        React.createElement(FreqChart_1.FreqChart, {context: this.context, source: this.inputStream})
	                    ), 
	                React.createElement("label", null, 
	                    "BPM", 
	                    React.createElement("input", {className: "bpm", type: "number", onChange: this.bpmChange, value: bpm.toString()})), 
	                React.createElement("input", {value: "Input", type: "button", onClick: this.addInput}), 
	                React.createElement("input", {value: "Kick", type: "button", onClick: this.addKick}), 
	                React.createElement("input", {value: "Snare", type: "button", onClick: this.addSnare}), 
	                React.createElement("input", {value: "Hihat", type: "button", onClick: this.addHihat})), 
	            React.createElement("div", {className: "loops"}, loops.map(l => React.createElement(Loop_1.LoopView, __assign({key: l.uid, bpm: bpm, worker: this.worker}, l)))), 
	            React.createElement("div", {className: "errors"}, errors)));
	    }
	    componentWillReceiveProps(newProps) {
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
	        this.getInputSource();
	    }
	    startTimer(bpm) {
	        this.worker.postMessage(bpm || this.props.bpm);
	    }
	    bpmChange(ev) {
	        this.props.updateBPM(parseInt(ev.currentTarget.value));
	    }
	    mute() {
	        // TODO: consider global-level state for input-mute
	        let willMute = !this.state.muteInput;
	        if (willMute) {
	            this.inputStream.disconnect(this.context.destination);
	        }
	        else {
	            this.inputStream.connect(this.context.destination);
	        }
	        this.setState({
	            muteInput: willMute,
	            hasInput: this.state.hasInput
	        });
	    }
	    getInputSource() {
	        // TODO: polyfilly fallybacky
	        navigator.mediaDevices.getUserMedia({ audio: true })
	            .then(stream => {
	            this.inputStream = this.context.createMediaStreamSource(stream);
	            this.setState({
	                hasInput: true,
	                muteInput: this.state.muteInput
	            });
	        });
	    }
	    addLoop(src) {
	        let l = {
	            uid: Date.now(),
	            context: this.context,
	            timing: constants_1.Timing.WHOLE,
	            name: DEFAULT_LOOPNAME,
	            buffer: null,
	            audio: {
	                processor: this.context.createScriptProcessor(),
	                gain: this.context.createGain(),
	            },
	        };
	        l.audio.gain.connect(this.context.destination);
	        // Called after loading InputSource
	        const whenDone = (buf) => {
	            l.buffer = buf;
	            this.props.addedLoop(l);
	        };
	        // Load buffer via wav
	        if (typeof (src) === 'string') {
	            // Hasn't been loaded yet
	            if (this.beats[src] === null) {
	                this.loadSound(src, whenDone);
	            }
	            else {
	                whenDone(this.beats[src]);
	            }
	        }
	        else if (this.inputStream) {
	            navigator.mediaDevices.getUserMedia({ audio: true })
	                .then(whenDone);
	        }
	    }
	    // Load a pre-defined audio WAV to use as an `InputBuffer`
	    loadSound(beat, done) {
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
	        };
	        request.send();
	    }
	}
	exports.App = react_redux_1.connect((s) => s, {
	    addedLoop: loop_1.addedLoop,
	    globalPause: actions_1.globalPause,
	    updateBPM: actions_1.updateBPM
	})(Root);


/***/ },

/***/ 211:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const constants_1 = __webpack_require__(209);
	function error(m) {
	    return {
	        type: constants_1.ActionType.Error,
	        data: m
	    };
	}
	exports.error = error;
	function globalPause(pause) {
	    return {
	        type: constants_1.ActionType.GlobalPause,
	        data: pause
	    };
	}
	exports.globalPause = globalPause;
	function muteMetronome(mute) {
	    return {
	        type: constants_1.ActionType.MuteMetronome,
	        data: mute
	    };
	}
	exports.muteMetronome = muteMetronome;
	function updateBPM(bpm) {
	    return {
	        type: constants_1.ActionType.UpdateBPM,
	        data: bpm
	    };
	}
	exports.updateBPM = updateBPM;


/***/ },

/***/ 212:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const constants_1 = __webpack_require__(209);
	function addedLoop(l) {
	    return {
	        type: constants_1.ActionType.AddedLoop,
	        data: l
	    };
	}
	exports.addedLoop = addedLoop;
	function renameLoop(loop, name) {
	    return {
	        type: constants_1.ActionType.RenameLoop,
	        data: { loop, name }
	    };
	}
	exports.renameLoop = renameLoop;
	function removeLoop(l) {
	    return {
	        type: constants_1.ActionType.RmLoop,
	        data: l
	    };
	}
	exports.removeLoop = removeLoop;
	function updateMeasures(loop, timing) {
	    return {
	        type: constants_1.ActionType.UpdateLpTiming,
	        data: { loop, timing }
	    };
	}
	exports.updateMeasures = updateMeasures;


/***/ },

/***/ 213:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const React = __webpack_require__(1);
	const react_redux_1 = __webpack_require__(199);
	const react_fa_1 = __webpack_require__(214);
	const constants_1 = __webpack_require__(209);
	const loop_1 = __webpack_require__(212);
	const Ticker_1 = __webpack_require__(227);
	__webpack_require__(230);
	const stopTick = {
	    [constants_1.Timing.WHOLE]: 0,
	    [constants_1.Timing.HALF]: 8,
	    [constants_1.Timing.QUARTER]: 4,
	};
	/*
	  A loop sourced from either raw input (getUserMedia) OR a predefined *.wav
	*/
	class Loop extends React.Component {
	    constructor(props, state) {
	        super(props, state);
	        this.queue = [];
	        this.startedRec = false;
	        this.recv = this.recv.bind(this);
	        this.tick = this.tick.bind(this);
	        this.remove = this.remove.bind(this);
	        props.audio.processor.onaudioprocess = this.recv;
	        props.worker.addEventListener('message', this.tick);
	        this.state = {
	            leftChunks: new Float32Array(0),
	            rightChunks: new Float32Array(0),
	            playback: null,
	            chunksLength: 0,
	            currentTick: 0,
	            recording: false,
	            playing: false
	        };
	    }
	    render() {
	        let p = this.props;
	        let { name, timing, context, buffer } = p;
	        let { playing, playback, chunksLength, recording, currentTick } = this.state;
	        let wavFile = buffer instanceof AudioBuffer;
	        return (React.createElement("div", {className: "loop"}, 
	            React.createElement("div", {className: "border"}), 
	            React.createElement("div", {className: "info"}, 
	                React.createElement(Ticker_1.Ticker, {beat: currentTick, timing: timing}), 
	                React.createElement("input", {className: "name", type: "text", onChange: (e) => p.renameLoop(p, e.currentTarget.value), value: name}), 
	                React.createElement("span", {className: "is-recording " + recording}), 
	                React.createElement("label", {className: "measures"}, 
	                    "Measures", 
	                    React.createElement("input", {type: "number", onChange: (e) => p.updateMeasures(p, parseInt(e.currentTarget.value)), value: timing.toString()})), 
	                React.createElement("div", {className: "chunks"}, chunksLength)), 
	            React.createElement("div", {className: "actions"}, 
	                React.createElement("span", {className: "record", title: "Start recording", disabled: recording, onClick: () => this.startRec()}, 
	                    React.createElement(react_fa_1.Icon, {name: "microphone", size: "2x"})
	                ), 
	                wavFile &&
	                    React.createElement("span", {className: "play", title: "Play sound", onClick: () => this.playSound()}, 
	                        React.createElement(react_fa_1.Icon, {name: "play", size: "2x"})
	                    ), 
	                playback &&
	                    React.createElement("span", {className: "playback", title: "Loop recording", onClick: () => playing ? this.stopPlayback() : this.startPlayback()}, 
	                        React.createElement(react_fa_1.Icon, {name: playing ? "stop" : "repeat", size: "2x"})
	                    ), 
	                React.createElement("span", {className: "remove", title: "Remove loop", onClick: this.remove}, 
	                    React.createElement(react_fa_1.Icon, {name: "trash", size: "2x"})
	                ))));
	    }
	    componentWillUnmount() {
	        this.props.worker.removeEventListener('message', this.tick);
	        this.stopRec();
	    }
	    // Recv tick from timer worker
	    tick(ev) {
	        let currentTick = ev.data;
	        this.setState(Object.assign({}, this.state, {
	            currentTick
	        }));
	        let { playing, recording } = this.state;
	        if (!this.state.recording && !this.state.playing)
	            return;
	        // determine stopping point
	        let st = stopTick[this.props.timing];
	        if (recording && currentTick == st && this.startedRec) {
	            this.stopRec();
	            this.startPlayback(true); // immediately start playing
	        }
	        // determine starting point
	        if (currentTick == 0) {
	            // cleanup disconnects, start playbacks...
	            if (this.queue.length > 0) {
	                this.queue.forEach(q => q.work());
	                this.queue = [];
	            }
	            this.startedRec = true;
	            let source = this.newSource();
	            if (source instanceof MediaStreamAudioSourceNode) {
	                source.connect(this.props.audio.processor);
	                // disconnect when finished
	                this.queue.push({ work: () => source.disconnect() });
	            }
	        }
	    }
	    // Recv event from onaudioprocess
	    recv(ev) {
	        let { recording, currentTick } = this.state;
	        if (!recording || !this.startedRec)
	            return;
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
	    pushQueue(fn) {
	        this.queue.push({
	            work: fn
	        });
	    }
	    // Start recording
	    startRec() {
	        if (this.state.recording)
	            return;
	        this.startedRec = false;
	        let { audio, context } = this.props;
	        if (this.state.playing) {
	            this.stopPlayback();
	        }
	        audio.processor.connect(audio.gain);
	        this.setState(Object.assign({}, this.state, {
	            leftChunks: new Float32Array(0),
	            rightChunks: new Float32Array(0),
	            chunksLength: 0,
	            playback: null,
	            playing: false,
	            recording: true
	        }));
	    }
	    // Stop recording and copy to playback
	    stopRec() {
	        let { recording } = this.state;
	        if (!recording)
	            return;
	        this.startedRec = false;
	        let { audio } = this.props;
	        audio.processor.disconnect();
	        this.setState(Object.assign({}, this.state, {
	            recording: false,
	            playback: this.copyPlayback()
	        }));
	    }
	    // Play what we've recorded
	    startPlayback(immediately = false) {
	        let { playback } = this.state;
	        let { audio } = this.props;
	        let source = this.newSource(playback);
	        if (!(source instanceof AudioBufferSourceNode))
	            return;
	        console.log("playback len", source.buffer.duration);
	        this.playbackSource = source;
	        source.loop = true;
	        source.connect(audio.gain);
	        if (immediately) {
	            source.start();
	        }
	        else {
	            // play at beginning of measure
	            this.pushQueue(source.start.bind(source));
	        }
	        //  update playback so we know we're playing
	        this.setState(Object.assign({}, this.state, {
	            playing: true
	        }));
	    }
	    // Stop playing last record
	    stopPlayback() {
	        if (!this.state.playback || !this.state.playing)
	            return;
	        this.playbackSource.stop();
	        // this.state.playback.disconnect();
	        this.setState(Object.assign({}, this.state, {
	            playing: false
	        }));
	    }
	    // copy whats in recording buffer and return
	    copyPlayback() {
	        let { audio, context, bpm } = this.props;
	        let { chunksLength, leftChunks, rightChunks } = this.state;
	        let buf = context.createBuffer(2, chunksLength, context.sampleRate);
	        buf.copyToChannel(leftChunks, 0);
	        buf.copyToChannel(rightChunks, 1);
	        return buf;
	    }
	    newSource(buf) {
	        let { buffer, context } = this.props;
	        let source;
	        if (!buf) {
	            buf = buffer;
	        }
	        if (buf instanceof AudioBuffer) {
	            source = context.createBufferSource();
	            if (source instanceof AudioBufferSourceNode) {
	                source.buffer = buf;
	            }
	        }
	        else {
	            source = context.createMediaStreamSource(buf);
	        }
	        return source;
	    }
	    playSound() {
	        let { audio } = this.props;
	        let source = this.newSource();
	        source.connect(audio.gain); // why necessary?
	        source.connect(audio.processor);
	        if (source instanceof AudioBufferSourceNode) {
	            source.start();
	        }
	    }
	}
	function mergeBuffers(recBuffers, recLength) {
	    let result = new Float32Array(recLength);
	    let offset = 0;
	    for (let i = 0; i < recBuffers.length; i++) {
	        result.set(recBuffers[i], offset);
	        offset += recBuffers[i].length;
	    }
	    return result;
	}
	exports.LoopView = react_redux_1.connect((s, p) => p, {
	    renameLoop: loop_1.renameLoop,
	    removeLoop: loop_1.removeLoop,
	    updateMeasures: loop_1.updateMeasures
	})(Loop);


/***/ },

/***/ 227:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const React = __webpack_require__(1);
	const constants_1 = __webpack_require__(209);
	__webpack_require__(228);
	const beats = [1, 2, 3, 4];
	exports.Ticker = (props) => {
	    let { timing, beat } = props;
	    let current = beats.map(b => constants_1.TimingStep[timing][b].indexOf(beat + 1) !== -1);
	    return (React.createElement("div", {className: "Ticker"}, beats.map(b => React.createElement("span", {key: b, className: current[b - 1] ? "current" : ""}))));
	};


/***/ },

/***/ 228:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(229);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(224)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./../../node_modules/sass-loader/index.js!./Ticker.scss", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./../../node_modules/sass-loader/index.js!./Ticker.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 229:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(217)();
	// imports
	
	
	// module
	exports.push([module.id, ".Ticker span {\n  display: inline-block;\n  border: 1px solid;\n  background: transparent;\n  margin: 4px;\n  height: 4px;\n  width: 4px; }\n  .Ticker span.current {\n    background: black; }\n", ""]);
	
	// exports


/***/ },

/***/ 230:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(231);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(224)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./../../node_modules/sass-loader/index.js!./Loop.scss", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./../../node_modules/sass-loader/index.js!./Loop.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 231:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(217)();
	// imports
	
	
	// module
	exports.push([module.id, ".loop {\n  display: flex;\n  flex-direction: column;\n  height: 15em;\n  width: 15em;\n  position: relative;\n  margin: 1em; }\n  .loop .border {\n    z-index: -1;\n    position: absolute;\n    left: 0;\n    top: 0;\n    border: 1px solid grey;\n    height: inherit;\n    width: inherit;\n    border-radius: 50%; }\n  .loop .info {\n    padding: 1em;\n    display: flex;\n    flex-direction: column;\n    align-items: center; }\n    .loop .info input {\n      background-color: transparent; }\n    .loop .info .measures {\n      text-align: center; }\n  .loop .actions {\n    display: flex;\n    align-content: center;\n    align-items: center; }\n    .loop .actions > span {\n      color: #282c37;\n      display: inline;\n      margin: auto; }\n      .loop .actions > span:hover {\n        cursor: pointer;\n        color: #C8BEBC; }\n", ""]);
	
	// exports


/***/ },

/***/ 232:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const React = __webpack_require__(1);
	const react_redux_1 = __webpack_require__(199);
	const Ticker_1 = __webpack_require__(227);
	const actions_1 = __webpack_require__(211);
	__webpack_require__(233);
	class metronome extends React.Component {
	    constructor(props, state) {
	        super(props, state);
	        this.state = {
	            beat: 0
	        };
	    }
	    render() {
	        let { context, on, muteMetronome } = this.props;
	        let { beat } = this.state;
	        let toggle = () => muteMetronome(!on);
	        if (on && beat % 4 === 0) {
	            var osc = context.createOscillator();
	            osc.connect(context.destination);
	            osc.frequency.value = 85;
	            if (beat === 12) {
	                osc.frequency.value = 100;
	            }
	            osc.start();
	            osc.stop(context.currentTime + .1);
	        }
	        return (React.createElement("div", {className: "Metronome " + (on ? '' : 'muted'), onClick: toggle}, 
	            React.createElement("input", {type: "checkbox", checked: on}), 
	            React.createElement(Ticker_1.Ticker, {beat: beat, timing: 1})));
	    }
	    componentDidMount() {
	        this.props.worker.addEventListener('message', (ev) => {
	            this.setState({ beat: ev.data });
	        });
	    }
	}
	exports.Metronome = react_redux_1.connect((s, p) => p, { muteMetronome: actions_1.muteMetronome })(metronome);


/***/ },

/***/ 233:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(234);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(224)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./../../node_modules/sass-loader/index.js!./Metronome.scss", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./../../node_modules/sass-loader/index.js!./Metronome.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 234:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(217)();
	// imports
	
	
	// module
	exports.push([module.id, ".Metronome {\n  text-align: center;\n  background-color: red; }\n  .Metronome:hover {\n    cursor: pointer;\n    color: #C8BEBC; }\n  .Metronome progress {\n    display: block; }\n  .Metronome.muted {\n    background-color: transparent;\n    color: black; }\n  .Metronome > input[type=\"checkbox\"] {\n    display: none; }\n", ""]);
	
	// exports


/***/ },

/***/ 235:
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	const React = __webpack_require__(1);
	const react_redux_1 = __webpack_require__(199);
	__webpack_require__(236);
	const HISTORY_LEN = 1000;
	const SAMPLE_SIZE = 256;
	class freqChart extends React.Component {
	    constructor(props, state) {
	        super(props, state);
	        this.analyser = props.context.createAnalyser();
	        this.analyser.fftSize = SAMPLE_SIZE;
	        props.source.connect(this.analyser);
	        this.state = {
	            data: new Uint8Array(this.analyser.frequencyBinCount),
	            history: []
	        };
	    }
	    render() {
	        let bars = Array.prototype.map.call(this.state.data, (d, i) => {
	            let st = { height: (d / 2) + 'px', display: 'inline' };
	            if (d === 0) {
	                st.display = 'none';
	            }
	            return React.createElement("span", {key: i, className: "bar", style: st});
	        });
	        let bars2 = bars.slice();
	        bars.reverse();
	        return (React.createElement("div", {className: "FreqChart"}, 
	            bars, 
	            bars2));
	    }
	    componentDidMount() {
	        this.drawFreqs();
	    }
	    componentWillUnmount() {
	        this.props.source.disconnect();
	        cancelAnimationFrame(this.animationFrame);
	    }
	    // Set the data for the frequency chart
	    drawFreqs() {
	        this.animationFrame = requestAnimationFrame(() => this.drawFreqs());
	        let newData = this.state.data.slice();
	        this.analyser.getByteFrequencyData(newData);
	        this.setState({
	            data: newData,
	            history: [] // TODO
	        });
	    }
	}
	exports.FreqChart = react_redux_1.connect((s, p) => p)(freqChart);


/***/ },

/***/ 236:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(237);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(224)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./../../node_modules/sass-loader/index.js!./FreqChart.scss", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./../../node_modules/sass-loader/index.js!./FreqChart.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 237:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(217)();
	// imports
	
	
	// module
	exports.push([module.id, ".FreqChart {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100px;\n  width: 100%; }\n  .FreqChart .bar {\n    width: 1px;\n    background-color: lightgrey; }\n", ""]);
	
	// exports


/***/ },

/***/ 238:
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag
	
	// load the styles
	var content = __webpack_require__(239);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(224)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./../../node_modules/sass-loader/index.js!./global.scss", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./../../node_modules/sass-loader/index.js!./global.scss");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },

/***/ 239:
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(217)();
	// imports
	
	
	// module
	exports.push([module.id, "#app, body, html {\n  width: 100%;\n  height: 100%;\n  padding: 0;\n  margin: 0; }\n\n#app {\n  font-family: Verdana, Geneva, sans-serif;\n  display: flex; }\n  #app .root, #app .tools, #app .loops {\n    height: 100%; }\n  #app .root {\n    display: flex;\n    width: 100%; }\n    #app .root .tools {\n      width: 10%;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      border-right: 1px solid lightgrey;\n      font-size: 10px; }\n      #app .root .tools > * {\n        border: none;\n        border-bottom: 1px solid lightgrey;\n        font-size: inherit;\n        width: 100%;\n        padding: 1em 0; }\n      #app .root .tools .freq.muted .bar {\n        background-color: #B02200; }\n      #app .root .tools .bpm {\n        width: 100%;\n        margin: 0;\n        padding: 0;\n        border: 0; }\n      #app .root .tools input[type=\"button\"] {\n        background: none; }\n        #app .root .tools input[type=\"button\"]:hover {\n          cursor: pointer;\n          color: #C8BEBC; }\n    #app .root .loops {\n      width: 90%;\n      display: flex;\n      flex-wrap: wrap;\n      overflow: auto;\n      justify-content: center;\n      align-content: flex-start;\n      margin-bottom: auto; }\n", ""]);
	
	// exports


/***/ }

});
//# sourceMappingURL=main.js.map