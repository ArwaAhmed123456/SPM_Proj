import React, { useState } from "react";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import "./styles/App.css";

function App() {
  const [dependencies, setDependencies] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState([]); // holds parsed + base64 data
  const [results, setResults] = useState([]);
  const [uploadMode, setUploadMode] = useState("project");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // REGEX-BASED FILE DETECTION
  // -------------------------------

  // Matches: package.json, package(1).json, package_copy.json
  // Excludes: package-lock.json, package-lock(1).json
  const isPackageJsonFile = (name) =>
    /^package(?!-lock).*\.json$/i.test(name);

  // Matches: requirements.txt, requirement.txt, requirements(1).txt, req.txt
  const isRequirementsFile = (name) =>
    /^requirements?(\s*\(\d+\))?\.txt$/i.test(name) ||
    /^req(\w*)?\.txt$/i.test(name);

  // Content-based fallback detection
  const detectFileTypeByContent = (text) => {
    try {
      const json = JSON.parse(text);
      if (json.dependencies || json.devDependencies) return "package-json";
    } catch {}

    if (/^[a-zA-Z0-9_\-]+([><=~!]=.*)?$/m.test(text)) {
      return "requirements";
    }

    return null;
  };

  // Convert file to Base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (err) => reject(err);
    });

  // -------------------------------
  // FILE UPLOAD HANDLER
  // -------------------------------
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);

    const allDeps = {};
    const fileRecords = [];

    for (const file of files) {
      try {
        const text = await file.text();
        const base64Content = await fileToBase64(file);
        const lower = file.name.toLowerCase();

        let detectedType = null;

        // 1. Filename matching
        if (isPackageJsonFile(lower)) detectedType = "package-json";
        else if (isRequirementsFile(lower)) detectedType = "requirements";

        // 2. Content detection if filename not clear
        if (!detectedType) detectedType = detectFileTypeByContent(text);

        // -------- Process Files --------
        if (detectedType === "package-json") {
          const pkg = JSON.parse(text);
          Object.assign(allDeps, pkg.dependencies || {});
          fileRecords.push({ type: "package-json", base64Content, content: pkg });
        }

        else if (detectedType === "requirements") {
          text.split("\n").forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
              const match = trimmed.match(/^([a-zA-Z0-9\-_]+)([>=<~!]+.+)?$/);
              if (match) allDeps[match[1]] = match[2] || "latest";
            }
          });
          fileRecords.push({ type: "requirements", base64Content, content: text });
        }

      } catch (err) {
        console.error("Error processing file:", file.name, err);
      }
    }

    setDependencies(allDeps);
    setUploadedFiles(fileRecords);

    console.log("Dependencies Set:", allDeps);
    console.log("Uploaded Files:", fileRecords);
  };

  // -------------------------------
  // BACKEND ANALYSIS
  // -------------------------------
  const analyze = async () => {
    setErrorMessage("");
    setResults([]);
    setLoading(true);

    try {
      let finalResults = [];

      const payload = {
        dependencies,
        files: uploadedFiles, // send all parsed files
      };

      const res = await axios.post(
        "http://localhost:4000/api/dependencies/analyze",
        payload
      );

      if (res.data?.dependencies) {
        finalResults = res.data.dependencies;
      }

      if (finalResults.length === 0) {
        setErrorMessage("No dependency data returned from analysis.");
      }

      setResults(finalResults);
    } catch (err) {
      console.error("Error analyzing dependencies:", err);
      setErrorMessage("Error analyzing dependencies. Check console.");
    }

    setLoading(false);
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="app-container">
      <h1 className="app-title">Dependency Health Agent</h1>

      {/* Upload Mode */}
      <div className="upload-mode-selector">
        <label>
          <input
            type="radio"
            value="project"
            checked={uploadMode === "project"}
            onChange={(e) => setUploadMode(e.target.value)}
          />
          Upload Project Directory
        </label>

        <label>
          <input
            type="radio"
            value="file"
            checked={uploadMode === "file"}
            onChange={(e) => setUploadMode(e.target.value)}
          />
          Upload Individual File
        </label>
      </div>

      {/* File Input */}
      {uploadMode === "project" ? (
        <input type="file" multiple onChange={handleFileUpload} />
      ) : (
        <input
          type="file"
          accept=".json,.txt"
          onChange={handleFileUpload}
        />
      )}

      {/* Analyze Button */}
      <button
        onClick={analyze}
        className="analyze-button"
        disabled={
          Object.keys(dependencies).length === 0 &&
          uploadedFiles.length === 0
        }
      >
        Analyze Dependencies
      </button>

      {/* Error */}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      {/* Loading */}
      {loading && <p>Analyzing... please wait</p>}

      {/* Dashboard */}
      {results.length > 0 ? (
        <Dashboard results={results} />
      ) : (
        !errorMessage &&
        !loading && <p>No data to display. Please upload files and analyze.</p>
      )}
    </div>
  );
}

export default App;
