/**
 * Helper utility to cleanly format question text from uploads/edits.
 * Automatically detects numbered list items like (1), (2), (3), (4), (5), 1), 2)..., 1., 2...
 * and formats them onto clean new lines with bold indigo labels.
 */
export function formatQuestionText(text: string | null | undefined): string {
  if (!text) return '';

  let formatted = String(text).trim();

  // Standardize newlines
  formatted = formatted.replace(/\r\n/g, '\n');

  // If text doesn't contain block HTML elements, convert raw \n to <br/>
  if (!/<(?:p|br|div|li|tr|table)\b[^>]*>/i.test(formatted)) {
    formatted = formatted.replace(/\n/g, '<br/>');
  } else {
    // If it has HTML tags but also raw un-tagged newlines
    formatted = formatted.replace(/([^\n>])\n([^\n<])/g, '$1<br/>$2');
  }

  // Format parenthesized numbered items like (1), (2), (3), (4), (5) or (a), (b) or (i), (ii)
  formatted = formatted.replace(
    (/(?:<br\s*\/?>|\n|^|\s+)(\((?:[1-9]|1[0-9]|20|[a-eA-E]|[ivxIVX]{1,4})\))(?=\s+[^\s])/g),
    (match, p1, offset, string) => {
      const before = string.slice(Math.max(0, offset - 12), offset);
      const isAlreadyOnNewLine = /<br\s*\/?>|\n|^$/i.test(before.trim());
      if (isAlreadyOnNewLine) {
        return `<span class="inline-block font-bold text-indigo-700 font-mono mr-1">${p1}</span>`;
      }
      return `<br/><span class="inline-block font-bold text-indigo-700 font-mono mr-1 mt-1">${p1}</span>`;
    }
  );

  // Format unparenthesized list items like " 1) ", " 2) " or " 1. ", " 2. " when occurring inline
  formatted = formatted.replace(
    (/(?:<br\s*\/?>|\n|\.\s+|\s{2,})([1-9]\)|[1-9]\.)(?=\s+[A-Za-z0-9\("'])/g),
    (match, p1, offset, string) => {
      const before = string.slice(Math.max(0, offset - 12), offset);
      const isAlreadyOnNewLine = /<br\s*\/?>|\n|^$/i.test(before.trim());
      if (isAlreadyOnNewLine) {
        return `<span class="inline-block font-bold text-indigo-700 font-mono mr-1">${p1}</span>`;
      }
      return `<br/><span class="inline-block font-bold text-indigo-700 font-mono mr-1 mt-1">${p1}</span>`;
    }
  );

  // Format closing prompts e.g. "Berdasarkan...", "Pernyataan yang...", "Yang merupakan..."
  const closingPrompts = [
    'Berdasarkan', 'Pernyataan yang', 'Pernyataan di atas', 'Dari pernyataan',
    'Dari data', 'Dari tabel', 'Dari ilustrasi', 'Pasangan yang', 'Yang termasuk',
    'Yang merupakan', 'Manakah dari', 'Berikut ini yang'
  ];

  closingPrompts.forEach((prompt) => {
    const regex = new RegExp(`(?<=\\.|\\!|\\?|>|\\)|[a-zA-Z0-9])\\s+(${prompt}\\b)`, 'g');
    formatted = formatted.replace(regex, '<br/><br/><strong class="text-slate-900">$1</strong>');
  });

  // Limit repetitive <br/> to maximum 2
  formatted = formatted.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br/><br/>');

  return formatted;
}
