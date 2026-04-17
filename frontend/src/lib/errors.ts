export function mapError(code?: string) {
    const map: Record<string, string> = {
        USER_ALREADY_IN_A_TEAM: "You're already in a team",
        TEAM_NAME_ALREADY_EXISTS: "Team name is already taken",
        TEAM_IS_FULL: "Team is full (max 3 members)",
        INVALID_INVITE_CODE: "Invalid invite code",
        USER_NOT_IN_A_TEAM: "You are not in a team",
        LEADER_MUST_DELETE_THE_TEAM_INSTEAD_OF_LEAVING:
            "Leader must delete the team",
        ONLY_LEADER_CAN_REMOVE_MEMBERS:
            "Only the team leader can remove members",
        RETRY_TRANSACTION: "Please retry",
        CONTEST_NOT_FOUND: "Contest not found",
        PROBLEM_NOT_FOUND: "Problem not found",
        INVALID_STATUS: "Invalid contest status",
        ROSTER_LOCKED: "Rosters are locked during an active contest",
        CONTEST_NOT_STARTED: "Contest has not started yet",
        CONTEST_LOCKED: "This contest is locked and cannot be modified",
        INVALID_STATUS_TRANSITION: "This status change is not allowed",
        INVALID_TIME_RANGE: "Start time must be before end time",
        FORBIDDEN: "You do not have permission to do this",
        MISSING_PARAM: "A required parameter is missing",
    };

    return map[code || ""] ?? "Something went wrong";
}
