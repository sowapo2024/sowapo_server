const fs = require('fs').promises;
const path = require('path');

async function convertHTML(filePath:string, encoding:string ='utf-8',content?:{}):Promise<string> {
  try {
    // Resolve the absolute path to the HTML file
    const absolutePath:string = path.resolve(filePath);

    // Read the HTML file content
    const htmlContent:string = await fs.readFile(absolutePath, encoding);

    Object.entries(content).forEach(([key,value])=>{
        htmlContent.replace(`{{${key}}}`,`${value}`)
    })

    return htmlContent;
  } catch (error) {
    console.error('Error reading HTML file:', error.message);
    throw error;
  }
}

// Example usage:

// convertHTML("./mail_templates/sendVerification.html")
//   .then((html) => {
//     console.log(html);
//   })
//   .catch((error) => {
//     console.error('Error:', error.message);
//   });


  module.exports = convertHTML;