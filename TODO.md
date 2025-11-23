# TODO for Missing Features and Improvements Implementation

## 1. Enhanced Validation of Incoming Messages
- Update `agent-interface/dependency_agent_worker.py` to:
  - Validate presence and correct format of required fields in task assignment JSON (e.g., message_id, type, task content).
  - Return appropriate error responses or error messages for invalid formats.

## 2. Support for search_patterns Input
- Add optional `search_patterns` parameter support in:
  - `agent-interface/dependency_agent_worker.py`: accept search_patterns and pass to backend.
  - `backend/controllers/dependencyCntrl.js`: filter or prioritize scanning of files based on search_patterns.
- Update API input validation accordingly.

## 3. Better Error Handling and Status Updates
- Enhance backend error handling in `dependencyCntrl.js`:
  - Return detailed error status messages (e.g., repo clone failure, parsing errors).
  - Add status flags for task status: "in_progress", "failed", "completed".
  - Implement retries if appropriate.
  
## 4. Zip File Processing Robustness
- Implement zip base64 decoding and extraction that can:
  - Handle large or complex archives gracefully.
  - Support nested folders and multi-language projects.
- Locate or create utilities under `backend/utils` for this purpose.
- Integrate this zip processing in backend controller or supervisor as relevant.

## 5. Concurrent Task Processing / Queue Management
- Add ability for handling multiple concurrent task assignments or queue tasks:
  - Investigate and update `SupervisorAgent_Main.py` or relevant files.
  - Use task queue or concurrency patterns to avoid task overload.

## 6. Logging and Monitoring
- Add detailed logging for:
  - Incoming tasks.
  - Processing steps and intermediate states.
  - Outgoing responses.
- Consider implementing a monitoring endpoint or simple log collector in backend.

## 7. Extended Output Metadata
- Include additional metadata in dependency analysis output:
  - Analysis duration.
  - Project language version.
  - Confidence scores.
- Update output format in backend controller and propagate to agent worker.

---

# Testing and Validation
- Update existing tests and add new tests for the features above.
- Ensure integration and E2E test coverage includes validation, error handling, concurrency, and zip processing.
- Address E2E test failures related to risk level expectations during feature updates.

---

# Next Steps
- Confirm task priorities and approve TODO plan.
- Implement features incrementally according to TODO.
- Run and validate tests after each major change.
