import { prisma } from "@/lib/db";
import { IntegrationProvider } from "@/generated/prisma/client";

interface CreateOAuthStateInput {
  state: string;
  userId: string;
  redirectPath?: string;
  expiresAt: Date;
}

export async function createGoogleOAuthState(
  input: CreateOAuthStateInput
) {
  return prisma.oAuthState.create({
    data: {
      state: input.state,
      userId: input.userId,
      redirectPath: input.redirectPath,
      expiresAt: input.expiresAt,
      provider: IntegrationProvider.GOOGLE,
    },
  });
}

export async function consumeGoogleOAuthState(state: string) {
  return prisma.$transaction(async (transaction) => {
    const oauthState = await transaction.oAuthState.findUnique({
      where: {
        state,
      },
    });

    if (!oauthState) {
      return null;
    }

    if (oauthState.provider !== IntegrationProvider.GOOGLE) {
      return null;
    }

    if (oauthState.consumedAt) {
      return null;
    }

    if (oauthState.expiresAt <= new Date()) {
      return null;
    }

    return transaction.oAuthState.update({
      where: {
        id: oauthState.id,
      },
      data: {
        consumedAt: new Date(),
      },
    });
  });
}

export async function deleteExpiredOAuthStates() {
  return prisma.oAuthState.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}