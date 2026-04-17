import { Request, Response } from "express";
import {
    createTeam,
    joinTeam,
    getMyTeam,
    leaveTeam,
    removeMember,
    deleteTeam,
} from "./team.service";

export const createTeamController = async (req: Request, res: Response) => {
    const team = await createTeam(req.user!.id, req.body);
    res.json(team);
};

export const joinTeamController = async (req: Request, res: Response) => {
    const { inviteCode } = req.body;
    const result = await joinTeam(req.user!.id, inviteCode);
    res.json(result);
};

export const getMyTeamController = async (req: Request, res: Response) => {
    const team = await getMyTeam(req.user!.id);
    res.json(team);
};

export const leaveTeamController = async (req: Request, res: Response) => {
    const result = await leaveTeam(req.user!.id);
    res.json(result);
};

export const removeMemberController = async (req: Request, res: Response) => {
    const result = await removeMember(req.user!.id, req.params.memberId as string);
    res.json(result);
};

export const deleteTeamController = async (req: Request, res: Response) => {
    const result = await deleteTeam(req.user!.id);
    res.json(result);
};

