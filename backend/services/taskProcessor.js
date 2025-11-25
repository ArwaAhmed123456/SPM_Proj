import dependencyRoutes from '../routes/dependencyRoute.js';

const validateHandshakeMessage = (message) => {
  if (
    !message ||
    typeof message !== 'object' ||
    !message.message_id ||
    !message.sender ||
    !message.recipient ||
    !message.type ||
    !message['results/task']
  ) {
    return false;
  }
  // Additional validation can be added here as needed
  return true;
};

const processTaskAssignment = async (task) => {
  // This function will simulate processing the task by forwarding dependencies to the analyze route logic
  // task is expected to have a similar structure as in /execute-dependency route's task input

  const { file_content_base64, file_type, project_name } = task || {};

  if (!file_content_base64 || !file_type) {
    return { status: 'failed', error: 'Missing file_content_base64 or file_type in task' };
  }

  // Decode base64 content and parse dependencies from package.json or requirements.txt
  let dependencies = {};

  try {
    const buffer = Buffer.from(file_content_base64, 'base64');
    const decodedContent = buffer.toString('utf-8');

    if (file_type === 'package.json') {
      const pkgJson = JSON.parse(decodedContent);
      dependencies = pkgJson.dependencies || {};
    } else if (file_type === 'requirements.txt') {
      dependencies = {};
      const lines = decodedContent.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([a-zA-Z0-9_-]+)([=><!~^]+)?(.+)?$/);
        if (match) {
          const pkg = match[1];
          const ver = match[3] ? match[3].trim() : '';
          dependencies[pkg] = ver || 'unknown';
        }
      }
    } else {
      return { status: 'failed', error: `Unsupported file type: ${file_type}` };
    }
  } catch (err) {
    return { status: 'failed', error: `Error parsing task file content: ${err.message}` };
  }

  // Use the analyzeDependencies logic from dependencyRoutes to analyze the dependencies
  let analysisResult;
  const mockReq = { body: { dependencies } };
  const mockRes = {
    status: (code) => ({
      json: (obj) => {
        analysisResult = obj;
        return obj;
      },
    }),
    json: (obj) => {
      analysisResult = obj;
      return obj;
    },
  };

  try {
    await dependencyRoutes.stack
      .find((layer) => layer.route?.path === '/analyze')
      .route.stack[0].handle(mockReq, mockRes);

    return { status: 'completed', result: analysisResult };
  } catch (err) {
    return { status: 'failed', error: `Error analyzing dependencies: ${err.message}` };
  }
};

export { validateHandshakeMessage, processTaskAssignment };
