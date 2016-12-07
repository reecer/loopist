import {ActionType, IAction, ILoop} from '../constants';

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

export function updateMeasures(loop: ILoop, measures: number) : IAction {
    console.log(loop, measures);
    return {
        type: ActionType.UpdateLpMeasures,
        data:  {loop, measures}
    }
}