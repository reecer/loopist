import {Component} from 'react';

// Some union types
export type SourceNode = AudioBufferSourceNode | MediaStreamAudioSourceNode;

// We accept either default .wav's, or WebAudioAPI input (AudioBuffer)
export type InputSource = AudioBuffer | string;

// Depending on our InputSource, we either have a buffer || a stream
export type InputBuffer = AudioBuffer | MediaStream;

// Our serializable, sharable, state
export interface IState {
    errors: string[]
    loops: ILoop[]
    bpm: number
    metronome: boolean;
}

// ILoop defines a single loop
export interface ILoop {
    uid: number;
    context: AudioContext;
    name: string;
    audio: LoopSource;
    timing: number;
    buffer: InputBuffer;
}

// Actions that affect the top-level IState
export enum ActionType {
    // Non-user originated
    Error = <any>"error",

    // Root-level
    GlobalPause = <any>"global_pause",
    MuteMetronome = <any>"mute_metronome",
    UpdateBPM = <any>"update_bpm",
    AddedLoop = <any>"added_loop",

    // Loop-level
    RmLoop = <any>"remove_loop",
    RenameLoop = <any>"rename_loop",
    UpdateLpTiming = <any>"update_loop_timing",
    StartRecord = <any>"start_record",
    StopRecord = <any>"stop_record",
}

export interface IAction {
    type: ActionType;
    data?: any;
}

// The audio source we want to use/control
export interface LoopSource {
    gain:  GainNode,          // volume control
    node: ScriptProcessorNode // where we connect an InputBuffer 
}

export const Beat = {
    KICK: 'kick.wav',
    HIHAT: 'hihat.wav',
    SNARE: 'snare.wav',
}

export const Timing = {
    WHOLE: 1,
    HALF: 2,
    QUARTER: 4,
    // EIGTH: 8,
    // SIXTEENTH: 16,
}

export const TimingStep: ({[ts: number] : ({[m: number]: number[]})}) = {
    [Timing.WHOLE]: {
        1: [1],
        2: [5],
        3: [9],
        4: [13]
    },
    [Timing.HALF]: {
        1: [1, 9],
        2: [3, 11],
        3: [5, 13],
        4: [7, 15]
    },
    [Timing.QUARTER]: {
        1: [1, 5, 9, 13],
        2: [2, 6, 10, 14],
        3: [3, 7, 11, 15],
        4: [4, 8, 12, 16]
        // 1: [1, 2, 3, 4],
        // 2: [5, 6, 7, 8],
        // 3: [9, 10, 11, 12],
        // 4: [13, 14, 15, 16]
    },
}