import json
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'agent-interface'))
from dependency_agent_worker import DependencyHealthWorker

class SupervisorAgent:
    def __init__(self):
        self.worker = DependencyHealthWorker("WorkerAgent_Dependency", "SupervisorAgent_Main")

    def assign_task(self, dependency, version):
        message = {
            "message_id": "task001",
            "sender": "SupervisorAgent_Main",
            "recipient": "WorkerAgent_Dependency",
            "type": "task_assignment",
            "task": {
                "name": "dependency_health_check",
                "parameters": {
                    "dependency": dependency,
                    "version": version
                }
            },
            "timestamp": "2025-11-13T15:30:00Z"
        }
        self.worker.handle_incoming_message(json.dumps(message))

if __name__ == "__main__":
    supervisor = SupervisorAgent()
    supervisor.assign_task("react", "^18.0.0")
