import React, { useState } from "react";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import "./styles/App.css";

function App() {
  const [dependencies, setDependencies] = useState({});
  const [results, setResults] = useState([]);
  const [fileType, setFileType] = useState('json');
  const [uploadMode, setUploadMode] = useState('project'); // 'file' or 'project'

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const allDeps = {};

    const processFile = async (file) => {
      const text = await file.text();
      if (file.name === 'package.json') {
        const pkg = JSON.parse(text);
        Object.assign(allDeps, pkg.dependencies || {});
        setFileType('json');
      } else if (file.name === 'requirements.txt') {
        // Parse requirements.txt: lines like "package==version" or "package>=version"
        text.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([a-zA-Z0-9\-_]+)([>=<~!]+.+)?$/);
            if (match) {
              allDeps[match[1]] = match[2] || 'latest';
            }
          }
        });
        setFileType('txt');
      }
    };

    for (const file of files) {
      if (file.name === 'package.json' || file.name === 'requirements.txt') {
        await processFile(file);
      }
    }
    setDependencies(allDeps);
  };

  const analyze = async () => {
    try {
      const res = await axios.post("http://localhost:4000/api/dependencies/analyze", { dependencies, fileType });
      setResults(res.data);
    } catch (error) {
      console.error("Error analyzing dependencies:", error);
      alert("Error analyzing dependencies. Please check the console for details.");
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Dependency Health Agent</h1>

      <div className="upload-mode-selector">
        <label>
          <input
            type="radio"
            value="project"
            checked={uploadMode === 'project'}
            onChange={(e) => setUploadMode(e.target.value)}
          />
          Upload Project Directory
        </label>
        <label>
          <input
            type="radio"
            value="file"
            checked={uploadMode === 'file'}
            onChange={(e) => setUploadMode(e.target.value)}
          />
          Upload Individual File
        </label>
      </div>

      {uploadMode === 'project' ? (
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="file-input"
        />
      ) : (
        <input
          type="file"
          accept=".json,.txt"
          onChange={handleFileUpload}
          className="file-input"
        />
      )}

      <button
        onClick={analyze}
        className="analyze-button"
        disabled={Object.keys(dependencies).length === 0}
      >
        Analyze Dependencies
      </button>

      {results.length > 0 && <Dashboard results={results} />}
    </div>
  );
}

export default App;
