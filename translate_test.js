/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const projectId = 'cognoto-translation';
const location = 'global';
const text = 'text to translate';

// Imports the Google Cloud Translation library
const {TranslationServiceClient} = require('@google-cloud/translate');
// Instantiates a client
const translationClient = new TranslationServiceClient();

async function translateText() {
  // Construct request
  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    contents: [text],
    mimeType: 'text/plain', // mime types: text/plain, text/html
    sourceLanguageCode: 'en',
    targetLanguageCode: 'bn',
  };
  console.log(request);

  // Run request
  const [response] = await translationClient.translateText(request);

  console.log(response)
  for (const translation of response.translations) {
    console.log(`Translation: ${translation.translatedText}`);
  }
}

// process.env.GOOGLE_APPLICATION_CREDENTIALS = "cognoto-translation-auth.json";
translateText();

