type ClerkUser = {
    emailAddresses: { emailAddress: string }[];
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
};

export const mapClerkUser = (clerkUser: ClerkUser) => {
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
        throw new Error("User email not found in Clerk");
    }

    return {
        email,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        avatar: clerkUser.imageUrl || null,
    };
};
