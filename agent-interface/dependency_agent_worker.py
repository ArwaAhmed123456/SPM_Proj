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
