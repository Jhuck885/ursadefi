import { Magic as MagicAdmin } from "@magic-sdk/admin";

let adminClient: MagicAdmin | null = null;

export const getMagicAdmin = () => {
  if (!adminClient) {
    const key = process.env.MAGIC_SECRET_KEY;
    if (!key) throw new Error("Magic secret key not found");

    adminClient = new MagicAdmin(key);
  }

  return adminClient;
};