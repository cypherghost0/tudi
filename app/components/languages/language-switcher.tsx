'use client';

import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function LanguageSwitcher() {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const savedLocale = Cookies.get('locale');
    if (savedLocale) {
      setLocale(savedLocale);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    setLocale(newLocale);
    Cookies.set('locale', newLocale, { expires: 365 });
    // You might want to reload the page to apply the language change
    window.location.reload();
  };

  return (
    <select
      value={locale}
      onChange={handleChange}
      className="rounded border px-2 py-1 bg-background text-sm"
    >
      <option value="en">English</option>
      <option value="fr">Français</option>
    </select>
  );
}
