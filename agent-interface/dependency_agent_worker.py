import json
import requests
from Abstract_Class_Worker_Agent import AbstractWorkerAgent

class DependencyHealthWorker(AbstractWorkerAgent):
    """
    Worker Agent that connects the Multi-Agent System to your Node backend.
    It acts as a bridge: receives messages, calls your backend, returns results.
    """

    def __init__(self, agent_id, supervisor_id, backend_url="http://localhost:4000/api/dependencies/analyze"):
        super().__init__(agent_id, supervisor_id)
        self.backend_url = backend_url
        self.ltm_file = "ltm_cache.json"

    # Required abstract methods
    def process_task(self, task_data: dict) -> dict:
        """Receive parameters from Supervisor, forward to Node backend, get scan result."""
        dependency = task_data.get("dependency")
        version = task_data.get("version")
        cache_key = f"{dependency}_{version}"

        cached = self.read_from_ltm(cache_key)
        if cached:
            print(f"[{self._id}] Found cached result in LTM.")
            return cached

        # Send request to Node backend for real analysis
        payload = {
            "dependencies": {dependency: version}
        }
        print(f"[{self._id}] Sending scan request to backend...")
        response = requests.post(self.backend_url, json=payload)
        data = response.json()

        # Store in memory and return
        self.write_to_ltm(cache_key, data)
        return data

    def validate_message(self, message_obj: dict) -> tuple[bool, str]:
        """Validate the incoming message for required fields and correct format."""  
        required_fields = ["message_id", "sender", "recipient", "type", "task", "timestamp"]
        for field in required_fields:
            if field not in message_obj:
                return False, f"Missing required field: {field}"

        if message_obj["type"] != "task_assignment":
            return False, f"Unsupported message type: {message_obj['type']}"

        task = message_obj.get("task")
        if not task or not isinstance(task, dict):
            return False, "Invalid or missing 'task' field"

        if "name" not in task or "parameters" not in task:
            return False, "Task must include 'name' and 'parameters' fields"
        
        if not isinstance(task["parameters"], dict):
            return False, "'parameters' field must be a dictionary"

        return True, "Valid message"

    def handle_incoming_message(self, message: str):
        """Validate and process incoming messages from Supervisor."""
        try:
            message_obj = json.loads(message)
        except json.JSONDecodeError:
            error_msg = "Invalid JSON format in message"
            print(f"[{self._id}] {error_msg}")
            return {"status": "error", "message": error_msg}

        valid, validation_msg = self.validate_message(message_obj)
        if not valid:
            print(f"[{self._id}] Message validation failed: {validation_msg}")
            return {"status": "error", "message": validation_msg}

        task_params = message_obj["task"]["parameters"]
        result = self.process_task(task_params)
        response_message = {
            "message_id": message_obj["message_id"],
            "sender": self._id,
            "recipient": message_obj["sender"],
            "type": "task_result",
            "result": result,
            "timestamp": "2025-11-13T12:00:00Z"
        }
        self.send_message(message_obj["sender"], response_message)
        return {"status": "success", "message": "Task processed"}

    def send_message(self, recipient: str, message_obj: dict):
        """Simulate sending message to supervisor (print or post to an API)."""
        print(f"\n[{self._id}] sending message to {recipient}:")
        print(json.dumps(message_obj, indent=4))

    def write_to_ltm(self, key: str, value: dict) -> bool:
        try:
            cache = {}
            try:
                with open(self.ltm_file, "r") as f:
                    cache = json.load(f)
            except FileNotFoundError:
                cache = {}
            cache[key] = value
            with open(self.ltm_file, "w") as f:
                json.dump(cache, f, indent=4)
            return True
        except Exception as e:
            print(f"LTM write error: {e}")
            return False

    def read_from_ltm(self, key: str):
        try:
            with open(self.ltm_file, "r") as f:
                data = json.load(f)
            return data.get(key)
        except FileNotFoundError:
            return None


if __name__ == "__main__":
    # Instantiate and test your worker
    agent = DependencyHealthWorker("WorkerAgent_Dependency", "SupervisorAgent_Main")

    # Simulated supervisor message
    supervisor_message = {
        "message_id": "task123",
        "sender": "SupervisorAgent_Main",
        "recipient": "WorkerAgent_Dependency",
        "type": "task_assignment",
        "task": {
            "name": "dependency_health_check",
            "parameters": {
                "dependency": "axios",
                "version": "^1.5.0"
            }
        },
        "timestamp": "2025-11-13T12:00:00Z"
    }

    agent.handle_incoming_message(json.dumps(supervisor_message))
