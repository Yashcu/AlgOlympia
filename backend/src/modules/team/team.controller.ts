import { Request, Response } from "express";
import {
    createTeam,
    joinTeam,
    getMyTeam,
    leaveTeam,
    removeMember,
    deleteTeam,
} from "./team.service";
import { createTeamSchema } from "./team.validator";
import { z } from "zod";

type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const createTeamController = async (req: any, res: Response) => {
    const data: CreateTeamInput = req.body;
    const team = await createTeam(req.user.id, data);
    res.json(team);
};

export const joinTeamController = async (req: any, res: Response) => {
    const { inviteCode } = req.body;
    const result = await joinTeam(req.user.id, inviteCode);
    res.json(result);
};

export const getMyTeamController = async (req: any, res: Response) => {
    const team = await getMyTeam(req.user.id);
    res.json(team);
};

export const leaveTeamController = async (req: any, res: Response) => {
    const result = await leaveTeam(req.user.id);
    res.json(result);
};

export const removeMemberController = async (req: any, res: Response) => {
    const result = await removeMember(req.user.id, req.params.memberId);
    res.json(result);
};

export const deleteTeamController = async (req: any, res: Response) => {
    const result = await deleteTeam(req.user.id);
    res.json(result);
};
