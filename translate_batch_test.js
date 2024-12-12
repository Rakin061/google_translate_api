/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
const fs = require('fs');
const data = require('./en.json');
const targetLanguageCode = 'fr';
const projectId = 'cognoto-translation';
const location = 'us-central1';
const inputFolderName = 'Languages';
const inputFileName = 'en1.tsv'; // with which name the tsv folder was uploaded
const inputUri = 'gs://cognoto-bucket/'+ inputFolderName +'/'+ inputFileName;
// const outputFolderName = 'Languagesout22';
const outputFolderName = new Date();
const outputUri = 'gs://cognoto-bucket/' + outputFolderName.toISOString() + '/';
// const outputUri = 'gs://cognoto-bucket/' + targetLanguageCode + '/';

//for uploading to bucket The ID of your GCS bucket
const bucketName = 'cognoto-bucket';
const filePath = 'en.tsv';
const destFileName = 'Languages/en1.tsv';

// For download The ID of your GCS file
// const fileName = 'Languages/en.tsv';
const fileName = outputFolderName.toISOString() + '/'+ bucketName + '_' + inputFolderName+ '_' + inputFileName.split('.')[0] + '_' +targetLanguageCode+ '_' +'translations.tsv';
// The path to which the file should be downloaded
const downloadFileDest = 'cloud.tsv';

// Imports the Google Cloud Translation library & Instantiates a client
const {TranslationServiceClient} = require('@google-cloud/translate');
const translationClient = new TranslationServiceClient();

// Instantiate the storage
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

async function uploadStringToGCS() {
    // const bucket = storage.bucket(bucketName);
    // const file = bucket.file("Languages/"+destFileName);
  
    // await file.save(tsvData, {
    //   contentType: 'text/tab-separated-values; charset=utf-8', // Specify the content type as TSV
    //   metadata: {
    //     cacheControl: 'no-cache', // Optional: set metadata, like cache control
    //   },
    // });
  
    // console.log(`String data uploaded to ${bucketName} as ${destFileName}`);
    const options = {
      destination: destFileName
    };
    
    console.log(bucketName)
    await storage.bucket(bucketName).upload(filePath, options);
    console.log(`${filePath} uploaded to ${bucketName} as ${destFileName}`);
  }

async function downloadFile() {
  // const options = {
  //   destination: downloadFileDest,
  // };

  // // Downloads the file
  // await storage.bucket(bucketName).file(fileName).download(options);

  // console.log(
  //   `gs://${bucketName}/${fileName} downloaded to ${downloadFileDest}.`
  // );

  const [contents] = await storage.bucket(bucketName).file(fileName).download();

  // Return the contents as a string
  return contents.toString();

}

function tsvToJson(tsv, outputFilename) {
  const json = {};
  const rows = tsv.split("\n");

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
}


function jsonToTsv(json) {
    const tsvRows = [];
    
    // Recursively traverse the JSON object to get all key-value pairs
    function traverseJson(obj, prefix = "") {
      for (const key in obj) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === "object" && obj[key] !== null) {
          traverseJson(obj[key], newKey);
        } else {
          // Convert each key-value pair to a TSV row
          tsvRows.push(`${newKey}\t${obj[key]}`);
        }
      }
    }
  
    traverseJson(json);
    return tsvRows.join("\n").replace(/^\uFEFF/, '');
        
}
  

async function batchTranslateText() {
  //Load the English json file
//   const tsvData = jsonToTsv(data);
// // console.log("TSV Data:\n", tsvData);

//   fs.writeFile('en.tsv', tsvData, 'utf8', err => {
//     if (err) {
//       console.error('Error writing file:', err);
//       return;
//     }
//     console.log('TSV file saved as en.tsv');
//   });

//   //upload to GCP Bucket
//   // uploadStringToGCS('en.tsv', bucketName, destFileName).catch(console.error);  
  uploadStringToGCS();


  // downloadFile().catch(console.error);
  
  // Construct request
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
  const [response] = await operation.promise();

  console.log(`Total Characters: ${response.totalCharacters}`);
  console.log(`Translated Characters: ${response.translatedCharacters}`);
  console.log(`output file name: ${fileName}`);

  // downloadFile().then((targetdata) => {
  //   // Use the data variable for further processing
  //   tsvToJson(targetdata, targetLanguageCode+'.json');
  //   // console.log('File contents:', targetdata);
  // })
  // .catch(console.error);
}

batchTranslateText();




// function tsvToJson(tsv) {
//     const json = {};
//     const rows = tsv.split("\n");
    
//     rows.forEach(row => {
//       const [key, value] = row.split("\t");
      
//       // Recreate the nested JSON structure using keys separated by '.'
//       const keys = key.split(".");
//       let current = json;
  
//       keys.forEach((k, i) => {
//         if (i === keys.length - 1) {
//           current[k] = value;
//         } else {
//           current[k] = current[k] || {};
//           current = current[k];
//         }
//       });
//     });
  
//     return json;
//   }
  //   function jsonToTsv(json) {
//     const tsvRows = [];
    
//     // Recursively traverse the JSON object to get all key-value pairs
//     function traverseJson(obj, prefix = "") {
//       for (const key in obj) {
//         const newKey = prefix ? ${prefix}.${key} : key;
//         if (typeof obj[key] === "object" && obj[key] !== null) {
//           traverseJson(obj[key], newKey);
//         } else {
//           // Convert each key-value pair to a TSV row
//           tsvRows.push(${newKey}\t${obj[key]});
//         }
//       }
//     }
  
//     traverseJson(json);
//     return tsvRows.join("\n");
//   }