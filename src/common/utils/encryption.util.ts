import * as bcrypt from 'bcrypt';

const SALT = 10;

export const hash = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT);
};

export const compareHash = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};
