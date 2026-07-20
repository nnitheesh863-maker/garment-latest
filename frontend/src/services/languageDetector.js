const LANGUAGE_RANGES = {
  ta: { name: 'Tamil', range: [0x0B80, 0x0BFF] },
  hi: { name: 'Hindi', range: [0x0900, 0x097F] },
  kn: { name: 'Kannada', range: [0x0C80, 0x0CFF] },
  ml: { name: 'Malayalam', range: [0x0D00, 0x0D7F] },
  te: { name: 'Telugu', range: [0x0C00, 0x0C7F] },
};

const TANGLISH_MARKERS = [
  'enaku', 'inniku', 'enna', 'epdi', 'enga', 'enga', 'yen', 'yaaru',
  'pannu', 'vaanga', 'poonga', 'irukku', 'veenum', 'kudukka', 'pathu',
  'solla', 'kelunga', 'paka', 'varuva', 'seri', 'illa', 'aama',
  'task', 'work', 'time', 'clock', 'complete', 'break',
  'production', 'machine', 'target', 'quantity', 'done',
];

export function detectLanguage(text) {
  if (!text || text.trim().length === 0) return 'en';

  const tamilChars = [...text].filter(c => {
    const code = c.charCodeAt(0);
    return code >= 0x0B80 && code <= 0x0BFF;
  }).length;

  const hindiChars = [...text].filter(c => {
    const code = c.charCodeAt(0);
    return code >= 0x0900 && code <= 0x097F;
  }).length;

  const kannadaChars = [...text].filter(c => {
    const code = c.charCodeAt(0);
    return code >= 0x0C80 && code <= 0x0CFF;
  }).length;

  const malayalamChars = [...text].filter(c => {
    const code = c.charCodeAt(0);
    return code >= 0x0D00 && code <= 0x0D7F;
  }).length;

  const teluguChars = [...text].filter(c => {
    const code = c.charCodeAt(0);
    return code >= 0x0C00 && code <= 0x0C7F;
  }).length;

  const totalUnicode = tamilChars + hindiChars + kannadaChars + malayalamChars + teluguChars;
  const words = text.toLowerCase().split(/\s+/);
  const englishWords = words.filter(w => /^[a-z]+$/.test(w)).length;

  if (tamilChars > 0 && englishWords > 0 && totalUnicode < englishWords * 3) {
    return 'tanglish';
  }

  if (tamilChars > totalUnicode * 0.3) return 'ta';
  if (hindiChars > totalUnicode * 0.3) return 'hi';
  if (kannadaChars > totalUnicode * 0.3) return 'kn';
  if (malayalamChars > totalUnicode * 0.3) return 'ml';
  if (teluguChars > totalUnicode * 0.3) return 'te';

  const tanglishScore = TANGLISH_MARKERS.reduce((score, word) => {
    if (text.toLowerCase().includes(word)) return score + 2;
    return score;
  }, 0);

  if (tanglishScore >= 3) return 'tanglish';

  return 'en';
}

export function getSpeechRecognitionLang(lang) {
  const langMap = {
    en: 'en-IN',
    ta: 'ta-IN',
    hi: 'hi-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    te: 'te-IN',
    tanglish: 'en-IN',
  };
  return langMap[lang] || 'en-IN';
}

export function getTTSLang(lang) {
  const langMap = {
    en: 'en-IN',
    ta: 'ta-IN',
    hi: 'hi-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    te: 'te-IN',
    tanglish: 'en-IN',
  };
  return langMap[lang] || 'en-IN';
}

export const LANGUAGE_NAMES = {
  en: 'English',
  ta: 'தமிழ்',
  hi: 'हिन्दी',
  kn: 'ಕನ್ನಡ',
  ml: 'മലയാളം',
  te: 'తెలుగు',
  tanglish: 'Tanglish',
};
