type ClerkUser = {
    emailAddresses: { emailAddress: string }[];
    firstName?: string | null;
    lastName?: string | null;
    imageUrl?: string | null;
};

export const mapClerkUser = (clerkUser: ClerkUser) => {
    const primaryEmail = clerkUser.emailAddresses?.find(
        (e) => e.emailAddress
    )?.emailAddress;

    if (!primaryEmail) {
        throw new Error("User email not found in Clerk");
    }

    const name =
        [clerkUser.firstName, clerkUser.lastName]
            .filter(Boolean)
            .join(" ") || null;

    return {
        email: primaryEmail,
        name,
        avatar: clerkUser.imageUrl || null,
    };
};
