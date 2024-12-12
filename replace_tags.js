// Online Javascript Editor for free
// Write, Edit and Run your Javascript code using JS Online Compiler

console.log("Try programiz.pro");
// Original JSON string
let jsonString = `{
    "ROLES": "{op, plural, =1 {Role} other {Roles}}",
    "DELETED_PROJECTS_TEXT": "All {numberOfProjects} {numberOfProjects, plural, =1 {project} other {projects}} are being deleted with this program. This action is not reversible.",
    "TASK_DUE_DATE": "Only {number, plural, =1 {1 day} =3 {3 days}} left until the task: <b>{taskName}</b> is due. ok how??",
    "OWNERS": "{num, plural, =0 {Owner} =1 {Owners}}",
    "LINKED_TASKS_NUMBER": "{number} {num, plural, =0 {task} =1 {tasks}} linked",
    "SUCCESS_MESSAGE": "Success! Project ‘{projectName}’ {archive, plural, =0 {canceled} =1 {canceled and archived}}. check full.",
    "USER_CANNOT_ASSIGN_ITSELF_AS_OWNER ok how??": "Projects can have only two owners.<br>{num, plural, =0 {Contact one of the project owner to be owner.} =1 {Remove one owner to assign yourself.}}",
    "SUBMITTED_ON": "Submitted {num, plural, =0 {} =1 {on: {date}}} by {user}",
    "DAYS_LEFT": "{days} {days, plural, =1 {day} other {days}} left",
    "HOURS_AVAILABLE": "{hours} h",

    "ACCOUNT": "{ num, plural, =1 {Compte} other {Comptes} }",
    "BUSINESS_TEAM": "{num, pluriel, =1 {Équipe commerciale} autre {Équipes commerciales}}",
    "CONFIGURATION": "{ num, pluriel, =1 {Configuration} autres {Configurations} }",
    "FIELDS": "{ num, pluriel, =1 {Champ} autres {Champs} }",
    "LEARNING_TEAM": "{ num, plural, =1 {Équipe d'apprentissage} other {Équipes d'apprentissage} }",
    "ORGANIZATION": "{num, pluriel, =1 {Organisation} autre {Organisations}}",
    "PROCESS": "{ num, pluriel, =1 {Processus} autres {Processus} }",
    "PROGRAM": "{num, pluriel, =1 {Programme} autre {Programmes}}",
    "PROGRAMS": "Tous les programmes",
    "PROJECT": "{num, pluriel, =1 {Projet} autre {Projets}}",
    "REQUEST_FORM": "{ num, plural, =1 {Formulaire de demande} other {Formulaires de demande} }",
    "TASK_BUNDLE": "{ num, plural, =1 {Groupe de tâches} other {Groupes de tâches} }",
    "TEAM": "{num, pluriel, =1 {Équipe} autre {Équipes}}",
    "TEAM_MANAGER": "Chef(s) d'équipe",
    "TEMPLATE": "{num, pluriel, =1 {Modèle} autre {Modèles}}",
    "USER": "{num, pluriel, =1 {Utilisateur} autre {Utilisateurs}}",
    "VENDOR": "{ num, plural, =1 {Fournisseur} other {Fournisseurs} }"
}`;

// Function to replace placeholders
function replacePlaceholders(jsonString) {
    // Replace single placeholders like `{op}` with `{{{Z_op_Z}}}`
    jsonString = jsonString.replace(/\{(\w+)\}/g, '{{{Z_$1_Z}}}');

    // Replace complex placeholders like `{op, plural, =1}` with `{{{Z_op_Z, Z_plural_Z, =1}}}`
    jsonString = jsonString.replace(/\{([^{}]+)\}/g, (match, innerText) => {
        // Replace each word in the inner content with `Z_word_Z`
        let transformed = innerText.split(',').map(word => {
            return word.trim().replace(/(\w+)/g, 'Z_$1_Z');
        }).join(', ');
        return `{{{${transformed}}}}`;
    });

    return jsonString;
}

// Transform JSON
let transformedJson = replacePlaceholders(jsonString);
console.log(transformedJson);


//----------------------------------------
// From claude


// const { parse } = require('@formatjs/icu-messageformat-parser');
// const { Translate } = require('@google-cloud/translate').v2;

// class ICUTranslator {
//   constructor(googleApiKey) {
//     this.translator = new Translate({ key: googleApiKey });
//   }

//   /**
//    * Extracts translatable parts from ICU message while preserving ICU syntax
//    * @param {string} message - ICU message format string
//    * @returns {Object} Object containing parts to translate and their placeholders
//    */
//   extractTranslatableParts(message) {
//     const ast = parse(message);
//     const parts = [];
//     const placeholders = [];
//     let counter = 0;

//     const processElement = (element) => {
//       if (element.type === 0) { // literal
//         if (element.value.trim()) {
//           const placeholder = `___${counter}___`;
//           parts.push(element.value);
//           placeholders.push(placeholder);
//           counter++;
//         }
//         return placeholder;
//       }

//       if (element.type === 1) { // argument
//         return `{${element.value}}`;
//       }

//       if (element.type === 2) { // number
//         return `{${element.value}, number, ${element.style || ''}}`;
//       }

//       if (element.type === 3) { // date
//         return `{${element.value}, date, ${element.style || ''}}`;
//       }

//       if (element.type === 4) { // plural
//         const cases = Object.entries(element.options).map(([key, value]) => {
//           const translatedValue = value.value.map(el => processElement(el)).join('');
//           return `${key} {${translatedValue}}`;
//         }).join('\n');
//         return `{${element.value}, plural, ${cases}}`;
//       }

//       if (element.type === 5) { // select
//         const cases = Object.entries(element.options).map(([key, value]) => {
//           const translatedValue = value.value.map(el => processElement(el)).join('');
//           return `${key} {${translatedValue}}`;
//         }).join('\n');
//         return `{${element.value}, select, ${cases}}`;
//       }

//       return '';
//     };

//     const processedMessage = ast.map(processElement).join('');

//     return {
//       parts,
//       placeholders,
//       processedMessage
//     };
//   }

//   /**
//    * Translates an ICU message format string while preserving ICU syntax
//    * @param {string} message - ICU message format string
//    * @param {string} targetLanguage - Target language code (e.g., 'es', 'fr')
//    * @returns {Promise<string>} Translated ICU message
//    */
//   async translateMessage(message, targetLanguage) {
//     try {
//       // Extract parts to translate
//       const { parts, placeholders, processedMessage } = this.extractTranslatableParts(message);

//       // Translate extracted parts
//       const [translations] = await this.translator.translate(parts, targetLanguage);
//       const translatedParts = Array.isArray(translations) ? translations : [translations];

//       // Reconstruct message with translations
//       let translatedMessage = processedMessage;
//       placeholders.forEach((placeholder, index) => {
//         translatedMessage = translatedMessage.replace(placeholder, translatedParts[index]);
//       });

//       return translatedMessage;
//     } catch (error) {
//       console.error('Translation error:', error);
//       throw error;
//     }
//   }
// }

// // Example usage
// async function example() {
//   const translator = new ICUTranslator('your-google-api-key');

//   const messages = [
//     // Simple message with variable
//     "Hello {name}! You have {count, plural, =0 {no messages} one {# message} other {# messages}}.",
    
//     // Select message
//     "{gender, select, male {He} female {She} other {They}} liked your photo.",
    
//     // Complex nested message
//     "{userCount, plural, =0 {No users} one {One user {gender, select, male {has} female {has} other {has}}} other {# users have}} logged in."
//   ];

//   for (const message of messages) {
//     try {
//       const translated = await translator.translateMessage(message, 'es');
//       console.log('\nOriginal:', message);
//       console.log('Translated:', translated);
//     } catch (error) {
//       console.error('Failed to translate:', message);
//     }
//   }
// }

// // Run example
// // example().catch(console.error);

// module.exports = ICUTranslator;

//--------------------------------------------------------------------