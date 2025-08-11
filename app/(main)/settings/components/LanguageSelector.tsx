'use client';

import LanguageSwitcher from '@/app/components/languages/language-switcher';

export function LanguageSelector() {
  return (
    <div className="flex items-center justify-between py-2">
      <span>Language</span>
      <LanguageSwitcher />
    </div>
  );
}
