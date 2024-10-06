require('dotenv').config();
const fs = require('fs');
const axios = require('axios');

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;
const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
const sourceLang = 'en';
const targetLang = 'es';

const translateText = async text => {
    try {
        const response = await axios.post(url, {
            q: text,
            source: sourceLang,
            target: targetLang,
            model: 'nmt', // Using Neural Machine Translation
            format: 'text',
        });

        return response.data.data.translations[0].translatedText;
    } catch (error) {
        console.error('Error during translation:', error);
        return text;
    }
};

const translateFile = async (srcLang, destLang) => {
    if (!API_KEY) {
        console.error('Please set GOOGLE_TRANSLATE_API_KEY in .env file');
        return;
    }
    try {
        const sourceData = JSON.parse(
            fs.readFileSync(
                `packages/translate/src/lib/${srcLang}.json`,
                'utf8',
            ),
        );
        const existingTranslations = fs.existsSync(
            `packages/translate/src/lib/${destLang}.json`,
        )
            ? JSON.parse(
                  fs.readFileSync(
                      `packages/translate/src/lib/${destLang}.json`,
                      'utf8',
                  ),
              )
            : {};
        const translatedData = { ...existingTranslations };

        for (const key in sourceData) {
            if (!translatedData[key]) {
                translatedData[key] = await translateText(sourceData[key]);
            }
        }

        fs.writeFileSync(
            `packages/translate/src/lib/${destLang}.json`,
            JSON.stringify(translatedData, null, 2),
        );
        console.log(
            `Translation completed and saved to packages/translate/src/lib/${destLang}.json`,
        );
    } catch (error) {
        console.error('Error:', error);
    }
};

translateFile('en', 'es');
