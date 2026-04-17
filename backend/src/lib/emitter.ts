let _emit: ((teamId: string) => void) | null = null;

export const setEmitter = (fn: (teamId: string) => void) => {
    _emit = fn;
};

export const emitTeamUpdate = (teamId: string) => {
    if (_emit) _emit(teamId);
};
