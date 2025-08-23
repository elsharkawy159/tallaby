"use server";

import { getUser } from "./auth";
import { db, sellers } from "@workspace/db";
import { eq } from "drizzle-orm";

export const getSellerByUserId = async (
  userId: string
): Promise<typeof sellers.$inferSelect | null> => {
  try {
    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, userId),
    });
    if (!seller) {
      return null;
    }
    return seller;
  } catch (error) {
    return null;
  }
};

export const getCurrentSeller = async (): Promise<
  typeof sellers.$inferSelect | null
> => {
  try {
    const { user } = await getUser();
    const seller = await getSellerByUserId(user.id);
    return seller;
  } catch (error) {
    return null;
  }
};
