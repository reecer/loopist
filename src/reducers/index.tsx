import {IState, ActionType, IAction} from '../constants';

export function update(state: IState, action: IAction) : IState {

    switch (action.type) {
        case ActionType.Error:
            return Object.assign({}, state, {
                errors: state.errors.concat(action.data)

            })

        case ActionType.GlobalPause:
            return Object.assign({}, state, {
                paused: action.data,
            })

        case ActionType.MuteMetronome:
            return Object.assign({}, state, {
                metronome: action.data,
            })

        case ActionType.UpdateBPM:
            return Object.assign({}, state, {
                bpm: action.data,
            })

        case ActionType.AddedLoop:
            action.data.uid = Date.now();
            return Object.assign({}, state, {
                loops: state.loops.concat(action.data)
            })

        case ActionType.RmLoop:
            return Object.assign({}, state, {
                loops: state.loops.filter(l => l.uid != action.data.uid)
            })

        case ActionType.UpdateLpMeasures:
            var {loop, measures} = action.data;
            return Object.assign({}, state, {
                loops: state.loops.map(l => {
                    if (l.uid != action.data.uid) {
                        l.measures = measures;
                    }
                    return l;
                })
            })

        case ActionType.RenameLoop:
            var {loop, name} = action.data;
            return Object.assign({}, state, {
                loops: state.loops.map(l => {
                    if (l.uid == loop.uid) {
                        l.name = name;
                    }
                    return l;
                })
            })

        default:
            return state;
   }
}
