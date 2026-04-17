// Frontend types for Team domain

export type TeamMember = {
    id: string;
    userId: string;
    teamId: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
    };
};

export type Team = {
    id: string;
    name: string;
    inviteCode: string;
    leaderId: string;
    createdAt: string;
    members: TeamMember[];
};

export type User = {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    role: "USER" | "ADMIN";
};
