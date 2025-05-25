import { Pbkdf2Response } from '@railgun-community/shared-models';
import { getRandomBytes, pbkdf2 } from '@railgun-community/wallet';

type HashPasswordParams = {
  secret: string;
  salt: string;
  iterations: number;
};

export const hashPasswordString = async ({ secret, salt, iterations }: HashPasswordParams): Promise<Pbkdf2Response> => {
  return pbkdf2(secret, salt, iterations);
};

export const setEncryptionKeyFromPassword = async (password: string): Promise<string> => {
  const salt: string = getRandomBytes(16);
  const [encryptionKey, hashPasswordStored] = await Promise.all([
    hashPasswordString({ secret: password, salt: salt, iterations: 100000 }), // Generate hash from password and salt
    hashPasswordString({ secret: password, salt: salt, iterations: 1000000 }), // Generate hash for stored password. Use more iterations for the stored value.
  ]);

  // await Promise.all([
  //   ..., // Save `hashPasswordStored` to local storage
  //   ..., // Save `salt` to local storage
  // ]);

  return encryptionKey;
};
