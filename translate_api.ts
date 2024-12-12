import { Storage } from "@google-cloud/storage";
import { TranslationServiceClient } from "@google-cloud/translate";
// const { Storage } = require('@google-cloud/storage');
// const { TranslationServiceClient } = require('@google-cloud/translate');

import fs from "fs";
import data from "./en_small_test.json";

// const{fs} = require('fs')
// const{data} = require('./en_small_test.json')

const projectId = "cognoto-translation";
const location = "us-central1";
const inputFolderName = "Tranlsate_Languages";
const inputFileName = "en_small.tsv"; // with which name the tsv folder was uploaded

const bucketName = "cognoto-bucket";
const destFileName = `${inputFolderName}/${inputFileName}`;

const storage = new Storage();
const translationClient = new TranslationServiceClient();

//Upload the source file to bucket
async function uploadStringToGCS(tsvData: string): Promise<void> {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(destFileName);

  await file.save(tsvData, {
    contentType: "text/tab-separated-values; charset=utf-8", // Specify the content type as TSV
    metadata: {
      cacheControl: "no-cache", // Optional: set metadata, like cache control
    },
  });
}

async function downloadFile(downloadFileName: string): Promise<string> {
  const [contents] = await storage.bucket(bucketName).file(downloadFileName).download();
  return contents.toString();
}

// For handling singular & plural entities for translation
function invertCase(str: string): string {
  return str
    .split("")
    .map((char) =>
      char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase(),
    )
    .join("");
}

function tsvToJson(tsv: string, outputFilename: string): void {
  const json: Record<string, any> = {};
  const rows = tsv.split("\n").map((row) => {
    return row
      .replace(/\[\[Z_(.*?)_Z\]\]/g, (_, p1) => invertCase(p1))
      .replace(/、/g, ",");
  });

  rows.forEach((row) => {
    const columns = row.split("\t");
    if (columns.length < 3) return;

    const key = columns[0];
    const value = columns[2];

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

  fs.writeFileSync(outputFilename, JSON.stringify(json, null, 2), "utf-8");
}


//Detect whether a json entry contains icupattern
function transformICUMessage(message: string): string {
  const icuPattern = /{\s*(\w+)\s*(?:,\s*(\w+)\s*,\s*([^{}]*(?:{[^{}]*}[^{}]*)*))?\s*}/g;

  if (!icuPattern.test(message)) {
    return message;
  }

  return message.replace(
    icuPattern,
    (match, variable, type, content) => {
      let transformed = `{ [[Z_${invertCase(variable)}_Z]]`;

      if (type && content) {
        const transformedType = `, [[Z_${invertCase(type)}_Z]], `;
        const transformedContent = content.replace(/\bother\b/g, "[[Z_OTHER_Z]]");
        transformed += transformedType + transformedContent;
      }

      transformed += " }";
      return transformed;
    },
  );
}

function jsonToTsv(json: Record<string, any>): string {
  const tsvRows: string[] = [];

  //Read the entire json file
  function traverseJson(obj: Record<string, any>, prefix = ""): void {
    for (const key in obj) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (typeof value === "object" && value !== null) {
        traverseJson(value, newKey);
      } else {
        const formattedValue = transformICUMessage(value);
        tsvRows.push(`${newKey}\t${formattedValue}`);
      }
    }
  }

  traverseJson(json);
  return tsvRows
    .join("\n")
    .replace(/^\uFEFF/, "")
    .replace(/("|\\")/g, "'");
}


async function deleteGCSFolder(deletefolderName: string): Promise<void> {
  const [files] = await storage.bucket(bucketName).getFiles({ prefix: deletefolderName });
  const deletePromises = files.map((file) => file.delete());
  await Promise.all(deletePromises);
}

const inputUri = `gs://cognoto-bucket/${inputFolderName}/${inputFileName}`;
const outputUri = `gs://cognoto-bucket/translated_language/`;

export async function batchTranslateText(targetLanguageCode: string): Promise<void> {
  
  const downloadFileName = `translated_language/${targetLanguageCode}/${bucketName}_${inputFolderName}_${inputFileName.split(".")[0]}_${targetLanguageCode}_translations.tsv`;

  await deleteGCSFolder(`translated_language/`+targetLanguageCode).catch(console.error);
  const tsvData = jsonToTsv(data);
  await uploadStringToGCS(tsvData);

  const request = {
    parent: `projects/${projectId}/locations/${location}`,
    sourceLanguageCode: "en",
    targetLanguageCodes: [targetLanguageCode],
    inputConfigs: [
      {
        mimeType: "text/plain",
        gcsSource: { inputUri },
      },
    ],
    outputConfig: {
      gcsDestination: { outputUriPrefix: outputUri+targetLanguageCode+'/'},
    },
  };

  const options = { timeout: 240000 };
  const [operation] = await translationClient.batchTranslateText(request, options);

  await operation.promise();

  downloadFile(downloadFileName)
    .then((targetdata) => {
      tsvToJson(targetdata, `${targetLanguageCode}.json`);
    })
    .catch(console.error);
}

const targetLanguageCode = process.argv[2]; // The second argument passed from the command line
console.log(`Translating to ${targetLanguageCode}`);
// Ensure the argument is passed
if (!targetLanguageCode) {
  console.error("Please provide a target language code.");
  process.exit(1);
}

// Call the function
batchTranslateText(targetLanguageCode)
  .then(() => {
    console.log("Translation completed successfully.");
  })
  .catch((err) => {
    console.error("An error occurred:", err);
  });