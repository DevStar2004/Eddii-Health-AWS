import { init, t, changeLanguage } from 'i18next';

const resources = {
    en: {
        translation: require('./en.json'),
    },
    es: {
        translation: require('./es.json'),
    },
};

init({
    compatibilityJSON: 'v3',
    lng: 'en',
    fallbackLng: 'en',
    resources,
    interpolation: {
        escapeValue: false,
    },
});

export { t, changeLanguage };
