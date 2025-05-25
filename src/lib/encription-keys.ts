import { Pbkdf2Response } from "@railgun-community/shared-models";
import { getRandomBytes, pbkdf2 } from "@railgun-community/wallet";

type HashPasswordParams = {
  secret: string;
  salt: string;
  iterations: number;
};

const hashPasswordString = async ({
  secret,
  salt,
  iterations,
}: HashPasswordParams): Promise<Pbkdf2Response> => {
  return pbkdf2(secret, salt, iterations);
};

export const setEncryptionKeyFromPassword = async (
  password: string
): Promise<string> => {
  const salt = getRandomBytes(16); // Uint8Array

  const [encryptionKey, hashPasswordStored] = await Promise.all([
    hashPasswordString({ secret: password, salt, iterations: 100000 }),
    hashPasswordString({ secret: password, salt, iterations: 1000000 }),
  ]);

  localStorage.setItem("railgun_salt", salt);
  localStorage.setItem(
    "railgun_password_verifier",
    Buffer.from(hashPasswordStored).toString("hex")
  );

  return encryptionKey;
};

export const getEncryptionKeyFromPassword = async (
  password: string
): Promise<string> => {
  const storedPasswordHashHex = localStorage.getItem(
    "railgun_password_verifier"
  );
  const storedSalt = localStorage.getItem("railgun_salt");

  if (!storedPasswordHashHex || !storedSalt) {
    throw new Error("Missing stored credentials.");
  }

  const [encryptionKey, hashPassword] = await Promise.all([
    hashPasswordString({
      secret: password,
      salt: storedSalt,
      iterations: 100000,
    }),
    hashPasswordString({
      secret: password,
      salt: storedSalt,
      iterations: 1000000,
    }),
  ]);

  const hashPasswordHex = Buffer.from(hashPassword).toString("hex");

  if (hashPasswordHex !== storedPasswordHashHex) {
    throw new Error("Incorrect password.");
  }

  return encryptionKey;
};
