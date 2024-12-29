const fs = require("fs");
const {
  createMigration,
  createModel,
  createController,
  createShowPage,
  createIndexPage,
  createEditPage,
  createNewPage,
  createWebRoutes,
} = require("./fileCreator");

const inputFileName = process.argv[2]; // Input JSON file from command line argument
const outputFileName = "migration.php"; // Output migration file

function createCrud(inputFileName) {
  createModel(inputFileName, inputFileName.replace(".json", ".php"));

  createMigration(inputFileName, outputFileName);

  createController(
    inputFileName,
    inputFileName.replace(".json", "Controller.php")
  );
  const modelName = inputFileName.replace(".json", "");
  const modelDir = `output/views/${modelName}`;
  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }
  createShowPage(inputFileName, `views/${modelName}/show.blade.php`);
  createIndexPage(inputFileName, `views/${modelName}/index.blade.php`);
  createEditPage(inputFileName, `views/${modelName}/edit.blade.php`);
  createNewPage(inputFileName, `views/${modelName}/create.blade.php`);

  createWebRoutes(inputFileName, `routes/web.php`);
}

createCrud(inputFileName);
