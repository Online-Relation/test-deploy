export const SIGNATURE = `
Kærlig hilsen

Rebecca Lund
Parterapeut GPT
`.trim();

export function addSignature(txt: string) {
  if (!txt) return SIGNATURE;

  // Fjern ALLE varianter af "Kærlig/Kærlige hilsner, Din parterapeut" (også hvis der er linjeskift mellem linjerne)
  let cleaned = txt
    .replace(/K(æ|ae)rlig(e)? hilsner?,?\s*Din parterapeut\s*/gim, '')
    .replace(/K(æ|ae)rlig(e)? hilsen,?\s*Din parterapeut\s*/gim, '');

  // Også hvis der er linjeskift imellem!
  cleaned = cleaned.replace(
    /K(æ|ae)rlig(e)? hilsner?,?[\s\r\n]*Din parterapeut[\s\r\n]*/gim,
    ''
  );

  // Undgå dobbelt-signatur
  if (cleaned.includes('Rebecca Lund') && cleaned.includes('Parterapeut GPT')) {
    return cleaned.trim();
  }

  return cleaned.trim() + '\n\n' + SIGNATURE;
}
