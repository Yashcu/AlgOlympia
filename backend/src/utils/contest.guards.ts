import { ContestStatus } from "@prisma/client";

/**
 * Returns true if the contest is locked for modification.
 * Problems and testcases cannot be added/modified once a contest is RUNNING or ENDED.
 */
export const isContestLocked = (status: ContestStatus): boolean =>
    status === ContestStatus.RUNNING || status === ContestStatus.ENDED;

/**
 * Strict FSM transition table.
 * Maps each status to the only status it is allowed to transition into.
 */
export const ALLOWED_TRANSITIONS: Record<ContestStatus, ContestStatus[]> = {
    [ContestStatus.DRAFT]:    [ContestStatus.UPCOMING],
    [ContestStatus.UPCOMING]: [ContestStatus.RUNNING],
    [ContestStatus.RUNNING]:  [ContestStatus.ENDED],
    [ContestStatus.ENDED]:    [], // terminal — no transitions allowed
};

/**
 * Returns true if transitioning from `current` to `next` is a valid FSM step.
 */
export const isValidTransition = (
    current: ContestStatus,
    next: ContestStatus
): boolean => ALLOWED_TRANSITIONS[current].includes(next);
