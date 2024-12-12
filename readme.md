# Google Translate API Batch Translation

This repository provides an implementation of the Google Translate API using TypeScript and JavaScript in Node.js. It enables batch translation of files from a source language to a desired target language. The implementation is designed for developers looking to integrate robust batch translation capabilities into their Node.js applications.

## Features

- **Batch Translation**: Translate large files in batches efficiently.
- **Language Support**: Supports a wide range of source and target languages.
- **TypeScript and JavaScript**: Written in both modern TypeScript and JavaScript for flexibility.
- **Google Cloud Translation API**: Built on top of Google's powerful translation API.

## Prerequisites

- Node.js installed on your system (version 14 or higher is recommended).
- A Google Cloud Platform (GCP) project with the Translation API enabled. Follow this [official guide](https://cloud.google.com/translate/docs/advanced/batch-translation#translate_v3_batch_translate_text-nodejs) to set up your GCP credentials and permissions.

## Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/Rakin061/google_translate_api.git
   cd google_translate_api
   ```

2. Install the required dependencies:

   ```bash
   npm install
   ```

## Usage

### Run Batch Translation

Use the following command to translate a file using the Google Translate API:

```bash
npx ts-node translate_api.ts <target-language>
```

### Example

To translate a file to Bengali (`bn`):

```bash
npx ts-node translate_api.ts bn
```

### Supported Languages

Refer to the [Google Cloud Translation API documentation](https://cloud.google.com/translate/docs/languages) for a complete list of supported languages and their codes.

## Configuration

Ensure you have set up your Google Cloud credentials and environment variables correctly. Refer to [this guide](https://cloud.google.com/translate/docs/advanced/batch-translation#translate_v3_batch_translate_text-nodejs) for detailed instructions.

## Scripts

- **Install Dependencies**:
  ```bash
  npm install
  ```

- **Run Translation Script**:
  ```bash
  npx ts-node translate_api.ts <target-language>
  ```

- **Clean and Build (Optional for JavaScript users)**:
  ```bash
  npm run build
  ```

## Contributing

Contributions are welcome! Feel free to submit a pull request or open an issue to report bugs or suggest features.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

For more information about the Google Translate API, refer to the [official documentation](https://cloud.google.com/translate/docs/advanced/batch-translation#translate_v3_batch_translate_text-nodejs).
