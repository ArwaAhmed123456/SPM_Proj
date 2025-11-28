import React, { useState } from "react";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import "./styles/App.css";

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]); // holds parsed + base64 data with dependencies
  const [results, setResults] = useState([]); // array of results for each file

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

    // Validate file types before processing
    const invalidFiles = files.filter(file => {
      const lower = file.name.toLowerCase();
      return !isPackageJsonFile(lower) && !isRequirementsFile(lower);
    });

    if (invalidFiles.length > 0) {
      setErrorMessage("You can only upload package.json or requirements.txt files.");
      setUploadedFiles([]);
      return;
    }

    await processFiles(files);
  };



  // -------------------------------
  // COMMON FILE PROCESSING
  // -------------------------------
  const processFiles = async (files) => {
    const fileRecords = [];
    let hasInvalidFiles = false;

    for (const file of files) {
      try {
        const text = await file.text();
        const base64Content = await fileToBase64(file);
        const lower = file.name.toLowerCase();

        let detectedType = null;
        let dependencies = {};

        // 1. Filename matching
        if (isPackageJsonFile(lower)) detectedType = "package-json";
        else if (isRequirementsFile(lower)) detectedType = "requirements";

        // 2. Content detection if filename not clear
        if (!detectedType) detectedType = detectFileTypeByContent(text);

        // -------- Process Files --------
        if (detectedType === "package-json") {
          const pkg = JSON.parse(text);
          dependencies = pkg.dependencies || {};
          fileRecords.push({ name: file.name, type: "package-json", base64Content, content: pkg, dependencies });
        }

        else if (detectedType === "requirements") {
          text.split("\n").forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
              const match = trimmed.match(/^([a-zA-Z0-9\-_]+)([>=<~!]+.+)?$/);
              if (match) dependencies[match[1]] = match[2] || "latest";
            }
          });
          fileRecords.push({ name: file.name, type: "requirements", base64Content, content: text, dependencies });
        } else {
          hasInvalidFiles = true;
        }

      } catch (err) {
        console.error("Error processing file:", file.name, err);
        hasInvalidFiles = true;
      }
    }

    if (hasInvalidFiles && fileRecords.length === 0) {
      setErrorMessage("You can only upload package.json or requirements.txt files.");
      setUploadedFiles([]);
    } else if (hasInvalidFiles) {
      setErrorMessage("Some files were invalid. Only package.json and requirements.txt files are supported.");
      setUploadedFiles(fileRecords);
    } else {
      setErrorMessage("");
      setUploadedFiles(fileRecords);
    }

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
      const allResults = [];

      for (const file of uploadedFiles) {
        if (Object.keys(file.dependencies).length === 0) continue;

        const payload = {
          dependencies: file.dependencies,
          files: [file], // send one file at a time
        };

        const res = await axios.post(
          "http://localhost:4000/api/dependencies/analyze",
          payload
        );

        if (res.data?.dependencies) {
          allResults.push({
            fileName: file.name,
            dependencies: res.data.dependencies,
            overallHealthScore: res.data.overallHealthScore,
            analysisDurationMs: res.data.analysisDurationMs,
          });
        }
      }

      if (allResults.length === 0) {
        setErrorMessage("No dependency data returned from analysis.");
      }

      setResults(allResults);
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
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1 className="app-title">
              Dependency Health Agent
            </h1>
            <p className="app-subtitle">Analyze and monitor your project dependencies</p>
          </div>
          <div className="header-logo">
            <img src="/HDA_logo.png" alt="HDA Logo" className="app-title-icon" />
          </div>
        </div>
      </header>

      <main className="app-container">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              Upload Dependencies
            </h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">
                Select package.json or requirements.txt files:
              </label>
              <br />
              <input
                type="file"
                accept=".json,.txt"
                onChange={handleFileUpload}
                className="form-input"
                multiple
              />
            </div>



            <div className="flex gap-md" style={{ marginTop: 'var(--spacing-lg)' }}>
              <button
                onClick={analyze}
                className="btn btn-primary"
                disabled={uploadedFiles.length === 0 || uploadedFiles.every(file => Object.keys(file.dependencies).length === 0)}
              >
                Analyze Dependencies
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <div>
              <strong>Error:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Analyzing dependencies... please wait</p>
          </div>
        )}

        {/* Dashboard */}
        {results.length > 0 ? (
          <Dashboard results={results} onRefreshAnalysis={analyze} />
        ) : (
          !errorMessage &&
          !loading && (
            <div className="card">
              <div className="card-body text-center">
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                  No data to display. Please upload dependency files and click "Analyze Dependencies".
                </p>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}

export default App;
