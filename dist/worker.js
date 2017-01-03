webpackJsonp([2],[
/* 0 */
/***/ function(module, exports) {

	
	/*
	  Using a web worker's `setInterval` to acheive precise timing. 
	  AudioBufferSourceNode.start(time: number) is not being used 
	  since it can only be applied to playback, not recording.
	*/
	const TICKS = 16; // ticks per measure
	const MS_PER_MIN = 60 * 1000; // ms in a minute
	const MEASURE_COUNT = 4; // 4/4 timing
	const bpmToMS = (bpm) => (MEASURE_COUNT * MS_PER_MIN) / bpm;
	
	var intvl;
	
	// Given bpm, emit every `TICKS`-th beat
	self.onmessage = (ev) => {
	  if (intvl) {
	    clearInterval(intvl);
	  }
	
	  // Type check just in case
	  let bpm = parseInt(ev.data);
	  if (isNaN(bpm)) return;
	
	  var tick = 0;
	  let ms = bpmToMS(bpm);
	
	  // tick every (i.e.) 16th beat in measure
	  intvl = setInterval(() => {
	    self.postMessage(++tick % TICKS);
	  }, ms / TICKS)
	};

/***/ }
]);
//# sourceMappingURL=worker.js.map