import en from '@/app/components/languages/en.json';
import fr from '@/app/components/languages/fr.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dictionaries: { [key: string]: any } = {
  en,
  fr,
};

export const getTranslations = (locale: string) => {
  return dictionaries[locale] || dictionaries['en']; // Fallback to English
};
