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
    measures: number;
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
    UpdateLpMeasures = <any>"update_loop_measures",
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
    HALF: 1/2,
    QUARTER: 1/4,
    EIGTH: 1/8,
    SIXTEENTH: 1/16,
}