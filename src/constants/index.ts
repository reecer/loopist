import {Component} from 'react';

export enum ActionType {
    Error = <any>"error",
}

export interface IAction {
    type: ActionType;
    data?: any;
}
export interface IState {
    errors: string[]
}

// Map of beat names to their buffers
export type BeatMap = ({[s: string] : AudioBuffer});

// Source types
export enum SourceType {
    WAV, INPUT
}

// The audio source we want to use
export interface LoopSource {
    source: AudioBufferSourceNode | MediaStreamAudioSourceNode,
    gain:  AudioNode,
    node: ScriptProcessorNode
}

export type InputSource = AudioBuffer | string;
export type InputBuffer = AudioBuffer | MediaStream;