// Excludes ambiguous characters (0/O, 1/I) so codes are easy to read aloud and retype.
const FAMILY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const FAMILY_CODE_LENGTH = 6;

export const generateFamilyCode = (): string => {
  let code = '';
  for (let i = 0; i < FAMILY_CODE_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * FAMILY_CODE_ALPHABET.length);
    code += FAMILY_CODE_ALPHABET[index];
  }
  return code;
};
