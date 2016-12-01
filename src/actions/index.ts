import {ActionType, IAction} from '../constants';

export function error(m: string) : IAction {
    return {
        type: ActionType.Error,
        data: m
    }
}