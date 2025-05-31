
// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { Locale, defaultLocale } from '@/i18n/config';

// interface LanguageContextType {
//   locale: Locale;
//   setLocale: (locale: Locale) => void;
//   dir: 'ltr' | 'rtl';
// }

// const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
//   const [locale, setLocaleState] = useState<Locale>(defaultLocale);

//   useEffect(() => {
//     const savedLocale = localStorage.getItem('locale') as Locale;
//     if (savedLocale) {
//       setLocaleState(savedLocale);
//     }
//   }, []);

//   const setLocale = (newLocale: Locale) => {
//     setLocaleState(newLocale);
//     localStorage.setItem('locale', newLocale);
//     document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
//     document.documentElement.lang = newLocale;
//   };

//   const dir = locale === 'ar' ? 'rtl' : 'ltr';

//   useEffect(() => {
//     document.documentElement.dir = dir;
//     document.documentElement.lang = locale;
//   }, [locale, dir]);

//   return (
//     <LanguageContext.Provider value={{ locale, setLocale, dir }}>
//       {children}
//     </LanguageContext.Provider>
//   );
// };

// export const useLanguage = () => {
//   const context = useContext(LanguageContext);
//   if (!context) {
//     throw new Error('useLanguage must be used within a LanguageProvider');
//   }
//   return context;
// };
