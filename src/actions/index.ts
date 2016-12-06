import {ActionType, IAction, ILoop} from '../constants';

export function error(m: string) : IAction {
    return {
        type: ActionType.Error,
        data: m
    }
}

export function globalPause(pause: boolean) : IAction {
    return {
        type: ActionType.GlobalPause,
        data: pause
    }
}

export function muteMetronome(mute: boolean) : IAction {
    return {
        type: ActionType.MuteMetronome,
        data: mute
    }
}

export function updateBPM(bpm: number) : IAction {
    return {
        type: ActionType.UpdateBPM,
        data: bpm
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