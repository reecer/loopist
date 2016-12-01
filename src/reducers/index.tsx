import {IState, ActionType, IAction} from '../constants';

export function update(state: IState, action: IAction) : IState {
    switch (action.type) {
        case ActionType.Error:
            return Object.assign({}, state, {
                errors: state.errors.concat(action.data)
            })
            
        default:
            return state;
   }
}
