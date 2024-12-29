const fs = require("fs");

function readFile(fileName, callback) {
  fs.readFile(fileName, "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err}`);
      return;
    }
    try {
      const jsonData = JSON.parse(data);
      callback(jsonData);
    } catch (parseErr) {
      console.error(`Error parsing JSON: ${parseErr}`);
    }
  });
}

function writeFile(fileName, data) {
  const outputDir = "./output";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  fs.writeFile(`${outputDir}/${fileName}`, data, (err) => {
    if (err) {
      console.error(`Error writing file: ${err}`);
      return;
    }
    console.log(`File has been written to ${outputDir}/${fileName}`);
  });
}

function createMigration(inputFileName, outputFileName) {
  readFile(inputFileName, (fileData) => {
    const tableName = inputFileName.replace(".json", ""); // Infer table name
    let upMigration = `Schema::create('${tableName}', function (Blueprint $table) {
              $table->id();\n`;
    let downMigration = `Schema::dropIfExists('${tableName}');`;

    fileData.forEach((column) => {
      upMigration += `            $table->${column.type}('${column.name}');\n`;
    });

    upMigration += "$table->timestamps();\n        });";

    const migrationTemplate = `<?php
  
use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;
  
      return new class extends Migration
      {
          /**
           * Run the migrations.
           */
          public function up(): void
          {
              ${upMigration}
          }
  
          /**
           * Reverse the migrations.
           */
          public function down(): void
          {
              ${downMigration}
          }
      };`;

    writeFile(outputFileName, migrationTemplate);
  });
}

function createModel(inputFileName, outputFileName) {
  readFile(inputFileName, (fileData) => {
    const modelName = inputFileName.replace(".json", ""); // Infer model name
    let modelContent = `<?php
      
          namespace App\\Models;
      
          use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
            use Illuminate\\Database\\Eloquent\\Model;
      
          class ${modelName} extends Model
          {
              protected $table = '${modelName}';
              use HasFactory;
      
              protected $fillable = [`;

    fileData.forEach((column) => {
      modelContent += `'${column.name}', `;
    });

    modelContent += `];
          }`;

    writeFile(outputFileName, modelContent);
  });
}

function createController(inputFileName, outputFileName) {
  readFile(inputFileName, (fileData) => {
    const modelName = inputFileName.replace(".json", ""); // Infer model name
    let controllerContent = `<?php
            
                namespace App\\Http\\Controllers;
            
                use App\\Models\\${modelName};
                use Illuminate\\Http\\Request;
            
                class ${modelName}Controller extends Controller
                {
                    public function index()
                    {
                        $${modelName} = ${modelName}::all();
                        return view('${modelName}.index', compact('${modelName}'));
                    }

                    public function create(){
                        return view('${modelName}.create');
                    }
            
                    public function store(Request $request)
                    {
                        $${modelName} = ${modelName}::create($request->all());
                        return redirect()->route('${modelName}.show', $${modelName}->id);
                    }
            
                    public function show(${modelName} $${modelName})
                    {
                        $${modelName} = ${modelName}::find($${modelName}->id);
                        return view('${modelName}.show', compact('${modelName}'));
                    }

                    public function edit(int $id){
                        $${modelName} = ${modelName}::find($id);
                        return view('${modelName}.edit', compact('${modelName}'));
                    }
            
                    public function update(Request $request, ${modelName} $${modelName})
                    {
                        $${modelName}->update($request->all());
                        return redirect()->route('${modelName}.show', $${modelName}->id);
                    }
            
                    public function destroy(int $id){
                        $${modelName} = ${modelName}::find($id);
                        $${modelName}->delete();
                        return redirect()->route('${modelName}.index');
                    }
                }`;

    writeFile(outputFileName, controllerContent);
  });
}

function createShowPage(inputFileName, outputFileName) {
  readFile(inputFileName, (fileData) => {
    const modelName = inputFileName.replace(".json", ""); // Infer model name
    let showPageContent = `<!DOCTYPE html>
      <html>
      <head>
        <title>${modelName} Show Page</title>
      </head>
      <body>
        <h1>${modelName} Show Page</h1>
        <p>Id: {{ $${modelName}->id }}</p>`;

    fileData.forEach((column) => {
      showPageContent += `<p>${column.name}: {{ $${modelName}->${column.name} }}</p>`;
    });

    showPageContent += `
        <a href="{{ route('${modelName}.index') }}">Back</a>
        <a href="{{ route('${modelName}.edit', $${modelName}->id) }}">Edit</a>
        <form action="{{ route('${modelName}.destroy', $${modelName}->id) }}" method="POST">
          @csrf
          @method('DELETE')
          <button type="submit">Delete</button>
        </form>
      </body>
      </html>`;

    writeFile(outputFileName, showPageContent);
  });
}

function createIndexPage(inputFileName, outputFileName) {
  readFile(inputFileName, (fileData) => {
    const modelName = inputFileName.replace(".json", ""); // Infer model name
    let indexPageContent = `<!DOCTYPE html>
      <html>
      <head>
      <title>${modelName} Index Page</title>
      </head>
      <body>
      <h1>${modelName} Index Page</h1>
      <table>
        <thead>
        <tr>
          <th>Id</th>`;

    fileData.forEach((column) => {
      indexPageContent += `<th>${column.name}</th>`;
    });

    indexPageContent += `
          <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        @foreach ($${modelName} as $item)
        <tr>
          <td>{{ $item->id }}</td>`;

    fileData.forEach((column) => {
      indexPageContent += `<td>{{ $item->${column.name} }}</td>`;
    });

    indexPageContent += `
          <td>
          <a href="{{ route('${modelName}.show', $item->id) }}">Show</a>
          <a href="{{ route('${modelName}.edit', $item->id) }}">Edit</a>
          <form action="{{ route('${modelName}.destroy', $item->id) }}" method="POST" style="display:inline;">
            @csrf
            @method('DELETE')
            <button type="submit">Delete</button>
          </form>
          </td>
        </tr>
        @endforeach
        </tbody>
      </table>
      <a href="{{ route('${modelName}.create') }}">Create New ${modelName}</a>
      </body>
      </html>`;

    writeFile(outputFileName, indexPageContent);
  });
}

function createEditPage(inputFileName, outputFileName) {
  readFile(inputFileName, (fileData) => {
    const modelName = inputFileName.replace(".json", ""); // Infer model name
    let editPageContent = `<!DOCTYPE html>
      <html>
      <head>
      <title>${modelName} Edit Page</title>
      </head>
      <body>
      <h1>${modelName} Edit Page</h1>
      <form action="{{ route('${modelName}.update', $${modelName}->id) }}" method="POST">
        @csrf
        @method('PUT')`;

    fileData.forEach((column) => {
      editPageContent += `
        <div>
        <label for="${column.name}">${column.name}</label>
        <input type="${migrationTypeToHtmlType[column.type]}" name="${
        column.name
      }" id="${column.name}" value="{{ $${modelName}->${column.name} }}">
        </div>`;
    });

    editPageContent += `
        <button type="submit">Submit</button>
      </form>
      </body>
      </html>`;

    writeFile(outputFileName, editPageContent);
  });
}

function createNewPage(inputFileName, outputFileName) {
  readFile(inputFileName, (fileData) => {
    const modelName = inputFileName.replace(".json", ""); // Infer model name
    let newPageContent = `<!DOCTYPE html>
      <html>
      <head>
      <title>${modelName} Create Page</title>
      </head>
      <body>
      <h1>${modelName} Create Page</h1>
      <form action="{{ route('${modelName}.store') }}" method="POST">
      @csrf`;

    fileData.forEach((column) => {
      newPageContent += `
      <div>
      <label for="${column.name}">${column.name}</label>
      <input type="${migrationTypeToHtmlType[column.type]}" name="${
        column.name
      }" id="${column.name}" placeholder="${column.name}">
      </div>`;
    });

    newPageContent += `
      <button type="submit">Submit</button>
      </form>
      </body>
      </html>`;

    writeFile(outputFileName, newPageContent);
  });
}

function createWebRoutes(inputFileName) {
  readFile(inputFileName, (fileData) => {
    const modelName = inputFileName.replace(".json", ""); // Infer model name
    let webRoutesContent = `Route::resource('${modelName.toLowerCase()}', 'App\\Http\\Controllers\\${modelName}Controller');
  `;

    writeFile("web.php", webRoutesContent);
  });
}

const migrationTypeToHtmlType = {
  string: "text",
  integer: "number",
  boolean: "checkbox",
  date: "date",
  datetime: "datetime-local",
  text: "textarea",
  float: "number",
  double: "number",
  decimal: "number",
  time: "time",
  timestamp: "datetime-local",
};

module.exports = {
  createMigration,
  createModel,
  createController,
  createShowPage,
  createIndexPage,
  createEditPage,
  createNewPage,
  createWebRoutes,
};
