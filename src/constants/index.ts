import {Component} from 'react';

export interface IState {
    errors: string[]
    loops: ILoop[]
    bpm: number
    metronome: boolean;
}

export enum ActionType {
    Error = <any>"error",
    GlobalPause = <any>"global_pause",
    MuteMetronome = <any>"mute_metronome",
    UpdateBPM = <any>"update_bpm",
    StartRecord = <any>"start_record",
    StopRecord = <any>"stop_record",
    AddedLoop = <any>"added_loop",
    RmLoop = <any>"remove_loop",
    RenameLoop = <any>"rename_loop"
}

export interface IAction {
    type: ActionType;
    data?: any;
}

export interface ILoop {
    uid: number;
    context: AudioContext;
    name: string;
    audio: LoopSource;
    measures: number;
    buffer: InputBuffer;
}

// The audio source we want to use/control
export interface LoopSource {
    gain:  GainNode,
    node: ScriptProcessorNode
}

export type SourceNode = AudioBufferSourceNode | MediaStreamAudioSourceNode;
export type InputSource = AudioBuffer | string;
export type InputBuffer = AudioBuffer | MediaStream;

// Map of beat names to their buffers
export type BeatMap = ({[s: string] : AudioBuffer});

export const Beat = {
    KICK : 'kick.wav',
    HIHAT : 'hihat.wav',
    SNARE : 'snare.wav',
}

export const Timing = {
    WHOLE: 1,
    HALF: 1/2,
    QUARTER: 1/4,
    EIGTH: 1/8,
    SIXTEENTH: 1/16,
}