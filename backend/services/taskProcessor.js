// services/taskProcessor.js

/**
 * Validate the handshake message structure
 * @param {Object} message
 * @returns {Boolean} true if valid, false otherwise
 */
export function validateHandshakeMessage(message) {
  const requiredFields = [
    "message_id",
    "sender",
    "recipient",
    "type",
    "related_message_id",
    "status",
    "results/task",
    "timestamp",
  ];

  for (const field of requiredFields) {
    if (!(field in message)) {
      return false;
    }
  }

  // Optional: further validation on types and allowed values can be added here

  return true;
}

/**
 * Process a task assignment message and return a response
 * @param {Object} taskAssignment - the task object from message.results/task
 * @returns {Object} result object with processing info and outputs
 */
export async function processTaskAssignment(taskAssignment) {
  // Example: process the task depending on input type

  if (!taskAssignment) {
    throw new Error("Missing task assignment object");
  }

  // You can extend this logic for git_repo_url, zip_file_base64, code_files_base64

  if (taskAssignment.git_repo_url) {
    // Logic to clone repo, analyze code, generate docs
    // Placeholder response:
    return {
      status: "completed",
      message: "Processed git repo URL task",
      repo: taskAssignment.git_repo_url,
    };
  } else if (taskAssignment.zip_file_base64) {
    // Logic to unzip, analyze, etc.
    return {
      status: "completed",
      message: "Processed zip file task",
    };
  } else if (taskAssignment.code_files_base64) {
    // Logic to decode files and analyze
    return {
      status: "completed",
      message: "Processed code files task",
      filesCount: taskAssignment.code_files_base64.length,
    };
  } else {
    throw new Error("Unknown or missing task input");
  }
}
