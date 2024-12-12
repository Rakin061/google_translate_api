/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const fs = require('fs');
const data = require('./en_small_test.json');
const targetLanguageCode = 'ar';
const projectId = 'cognoto-translation';
const location = 'us-central1';
const inputFolderName = 'Languages';
const inputFileName = 'en1.tsv'; // with which name the tsv folder was uploaded
const inputUri = 'gs://cognoto-bucket/'+ inputFolderName +'/'+ inputFileName;
const outputUri = 'gs://cognoto-bucket/' + targetLanguageCode + '/';

//for uploading to bucket The ID of your GCS bucket
const bucketName = 'cognoto-bucket';
const filePath = 'en.tsv';
const destFileName = 'Languages/en1.tsv';

const downloadFileName = targetLanguageCode + '/'+ bucketName + '_' + inputFolderName+ '_' + inputFileName.split('.')[0] + '_' +targetLanguageCode+ '_' +'translations.tsv';

const {TranslationServiceClient} = require('@google-cloud/translate');
const translationClient = new TranslationServiceClient();

// Instantiate the storage
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

async function uploadStringToGCS(tsvData) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(destFileName);
  
    await file.save(tsvData, {
      contentType: 'text/tab-separated-values; charset=utf-8', // Specify the content type as TSV
      metadata: {
        cacheControl: 'no-cache', // Optional: set metadata, like cache control
      },
    });
  
    console.log(`String data uploaded to ${bucketName} as ${destFileName}`);


  }

async function downloadFile() {

    const [contents] = await storage.bucket(bucketName).file(downloadFileName).download();

  // Return the contents as a string
  return contents.toString();

}

function invertCase(str) {
  return str
      .split('')
      .map(char => 
          char === char.toUpperCase() 
              ? char.toLowerCase() 
              : char.toUpperCase()
      )
      .join('');
}

function tsvToJson(tsv, outputFilename) {
  const json = {};

  const rows = tsv.split("\n").map(row => {

    return row
      // Replace [[Z_ and _Z]] placeholders and invert the case of the word inside the placeholder
      .replace(/\[\[Z_(.*?)_Z\]\]/g, (match, p1) => invertCase(p1)).replace(/、/g, ",");
  });

  rows.forEach(row => {
    const columns = row.split("\t");

    // Check if there are at least three columns in the row
    if (columns.length < 3) return;

    const key = columns[0];
    const value = columns[2];

    // Recreate the nested JSON structure using keys separated by '.'
    const keys = key.split(".");
    let current = json;

    keys.forEach((k, i) => {
      if (i === keys.length - 1) {
        current[k] = value;
      } else {
        current[k] = current[k] || {};
        current = current[k];
      }
    });
  });

  // Convert the JSON object to a string and save it as a file
  fs.writeFileSync(outputFilename, JSON.stringify(json, null, 2), "utf-8");
  console.log("Translated file saved as "+targetLanguageCode+".json");
}

function transformICUMessage(message) {
  // Updated regex pattern to capture until a standalone closing brace `}` not followed by `{`
  const icuPattern = /{\s*(\w+)\s*(?:,\s*(\w+)\s*,\s*([^{}]*(?:{[^{}]*}[^{}]*)*))?\s*}/g;
  
  // Check if the message contains ICU syntax
  if (!icuPattern.test(message)) {
      return message; // No match, return null or handle as needed
  }

  //---------------------------------test w/case-------------------
  const transformedMessage = message.replace(icuPattern, (match, variable, type, content) => {
    // Start with transforming the variable name
    let transformed = `{ [[Z_${invertCase(variable)}_Z]]`;

    // If there is a type (like "plural") and content, transform them as well
    if (type && content) {
        // Replace 'plural' keyword with 'Z_plural_Z'
        let transformedType = `, [[Z_${invertCase(type)}_Z]], `;
        
        // Transform content inside nested braces
        let transformedContent = content
            .replace(/\bother\b/g, "[[Z_OTHER_Z]]")  // Replace 'other' with 'Z_other_Z'
            // .replace(/\b(\w+)\b/g, "Z_$1_Z")     // Replace variable names like {day} with {Z_day_Z}
            // .replace(/{\s*(\w+)\s*}/g, '{ Z_$1_Z }');  // Also handle any standalone variable braces

        transformed += transformedType + transformedContent;
    }

    transformed += ' }';
    return transformed;
});



  return transformedMessage;
}

function jsonToTsv(json) {
    const tsvRows = [];
    // const icuPattern = /{\s*(\w+)\s*(?:,\s*(\w+)\s*,\s*([^{}]*(?:{[^{}]*}[^{}]*)*))?\s*}/g;

    // Recursively traverse the JSON object to get all key-value pairs
    function traverseJson(obj, prefix = "") {
      for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        if (typeof obj[key] === "object" && obj[key] !== null) {
          traverseJson(obj[key], newKey);
        } else {
          // Convert each key-value pair to a TSV row
          // tsvRows.push(`${newKey}\t${obj[key]}`);


          // const formattedValue = (typeof value === "string" && icuPattern.test(value)) ? transformICUMessage(value) : value;
          const formattedValue = transformICUMessage(value);

          // Convert each key-value pair to a TSV row
          tsvRows.push(`${newKey}\t${formattedValue}`);
        }
      }
    }
  
    traverseJson(json);
    return tsvRows.join("\n").replace(/^\uFEFF/, '').replace(/("|\\")/g, "'");
        
}
  
async function deleteGCSFolder(deletefolderName) {
  // Get all files in the folder
  const [files] = await storage.bucket(bucketName).getFiles({ prefix: deletefolderName });

  // Delete each file
  const deletePromises = files.map(file => file.delete());
  await Promise.all(deletePromises);

  console.log(`Folder ${deletefolderName} deleted.`);
}

async function batchTranslateText() {
  //----------------------clear the output folder before begining-------------------------------------
  //
  deleteGCSFolder(targetLanguageCode).catch(console.error); // clear the files if already exists 
  //-----------------------------------------------------------

  //----------------------Load the English json file-------------------------------------
  //
  // data = "halum";
  const tsvData = jsonToTsv(data);

  //
  await uploadStringToGCS(tsvData);

  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    sourceLanguageCode: 'en',
    targetLanguageCodes: [targetLanguageCode],
    inputConfigs: [
      {
        mimeType: 'text/plain', // mime types: text/plain, text/html
        gcsSource: {
          inputUri: inputUri,
        },
      },
    ],
    outputConfig: {
      gcsDestination: {
        outputUriPrefix: outputUri,
      },
    },
  };

  // Setup timeout for long-running operation. Timeout specified in ms.
  const options = {timeout: 240000};
  // Batch translate text using a long-running operation with a timeout of 240000ms.
  console.log(request);
  const [operation] = await translationClient.batchTranslateText(
    request,
    options
  );

  // Wait for operation to complete.
  console.log('translating....')
  const [response] = await operation.promise();
  console.log('translating done.')
  console.log(`Total Characters: ${response.totalCharacters}`);
  console.log(`Translated Characters: ${response.translatedCharacters}`);
  console.log(`output file name: ${downloadFileName}`);
  //------------------------------------------------------------------------

  //------------------------download the translated file and save it as json-----------------------------------
  //
  downloadFile().then((targetdata) => {
    // Use the data variable for further processing
    tsvToJson(targetdata, targetLanguageCode+'.json');
    // console.log('File contents:', targetdata);
  })
  .catch(console.error);

}

try{
  batchTranslateText();
} catch(e){
  console.log(e);
}