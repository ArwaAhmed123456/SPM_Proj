import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import unzipper from 'unzipper';

export async function generateApiDocsFromInput(input) {
  /**
   * input can be:
   * - { type: "github", repoUrl: "https://github.com/..." }
   * - { type: "zip", fileBuffer: <Buffer> }
   * - { type: "codeFile", files: [{ filename, content }, ...] }
   */

  if (input.type === 'github') {
    // Clone repo to temp folder
    const tempDir = `/tmp/${Date.now()}_repo`;
    const git = simpleGit();
    await git.clone(input.repoUrl, tempDir);
    return analyzeProjectFolder(tempDir);
  } else if (input.type === 'zip') {
    // Unzip buffer to temp dir
    const tempDir = `/tmp/${Date.now()}_unzipped`;
    await unzipBufferToFolder(input.fileBuffer, tempDir);
    return analyzeProjectFolder(tempDir);
  } else if (input.type === 'codeFile') {
    return analyzeCodeFiles(input.files);
  } else {
    throw new Error('Unsupported input type for API doc generation');
  }
}

async function analyzeProjectFolder(folderPath) {
  // Recursively read files, look for route files (e.g., *.js in routes/ or controllers/)
  // Parse files to extract endpoints, methods, etc.
  // For simplicity, could use regex or a parsing library (e.g., AST parser like acorn or babel-parser)
  // Return JSON structure of all endpoints found
  // This is a placeholder function for demonstration
  
  // Example: find all .js files inside routes folder
  const routesFolder = path.join(folderPath, 'routes');
  const files = fs.readdirSync(routesFolder).filter(f => f.endsWith('.js'));

  const allEndpoints = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(routesFolder, file), 'utf-8');
    // TODO: parse content for endpoints and push to allEndpoints
    // For now, just add a dummy endpoint
    allEndpoints.push({
      file,
      endpoints: [
        {
          path: '/example',
          method: 'GET',
          summary: 'Example endpoint',
          description: 'This is a dummy example endpoint',
          requestSchema: null,
          responseSchema: { type: 'object', properties: { message: { type: 'string' } } },
          errors: [{ code: 404, description: 'Not Found' }],
        }
      ]
    });
  }

  return allEndpoints;
}

async function unzipBufferToFolder(buffer, folderPath) {
  // create folder if not exists
  fs.mkdirSync(folderPath, { recursive: true });
  return new Promise((resolve, reject) => {
    const stream = unzipper.Extract({ path: folderPath });
    stream.on('close', resolve);
    stream.on('error', reject);
    stream.end(buffer);
  });
}

function analyzeCodeFiles(files) {
  // For raw code files input, parse and extract endpoints similarly
  // Return JSON summary
  // Placeholder demo
  return files.map(file => ({
    filename: file.filename,
    endpoints: [
      {
        path: '/example-from-file',
        method: 'POST',
        summary: 'Example POST endpoint',
        description: 'Demo endpoint extracted from file content',
        requestSchema: null,
        responseSchema: { type: 'object', properties: { success: { type: 'boolean' } } },
        errors: [],
      }
    ]
  }));
}
