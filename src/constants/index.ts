import {Component} from 'react';

export enum ActionType {
    Error = <any>"error",
}

export interface IAction {
    type: ActionType;
    data?: any;
}
// TODO: add/manage errors on IState
export interface IState {
    errors: string[]
}
