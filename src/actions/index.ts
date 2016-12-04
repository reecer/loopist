import {ActionType, IAction, ILoop} from '../constants';

export function error(m: string) : IAction {
    return {
        type: ActionType.Error,
        data: m
    }
}

export function addedLoop(l: ILoop) : IAction {
    return {
        type: ActionType.AddedLoop,
        data: l
    }
}

export function renameLoop(loop: ILoop, name: string) : IAction {
    return {
        type: ActionType.RenameLoop,
        data: {loop, name}
    }
}

export function removeLoop(l: ILoop) : IAction {
    return {
        type: ActionType.RmLoop,
        data: l
    }
}

export function startRecording(l: ILoop) : IAction {
    return {
        type: ActionType.StartRecord,
        data: l
    }
}

export function stopRecording(l: ILoop) : IAction {
    return {
        type: ActionType.StopRecord,
        data: l
    }
}