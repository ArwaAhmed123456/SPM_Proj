import axios from "axios";
import Dependency from "../models/DependencyModel.js";
import { calculateHealthScore } from "../utils/healthScore.js";

// Fetch npm package info and vulnerabilities using OSV API
export const analyzeDependencies = async (req, res) => {
  try {
    const { dependencies, packageJson } = req.body;
    let deps = {};
    if (packageJson && packageJson.dependencies && typeof packageJson.dependencies === 'object' && !Array.isArray(packageJson.dependencies)) {
      deps = packageJson.dependencies;
    } else if (dependencies && typeof dependencies === 'object' && !Array.isArray(dependencies)) {
      deps = dependencies;
    } else if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      deps = req.body;
    }
    if (Object.keys(deps).length === 0) {
      return res.status(200).json([]);
    }
    const results = [];

    for (const [pkg, version] of Object.entries(deps)) {
      // Get latest version from npm registry
      let latestVersion = "unknown";
      try {
        const npmData = await axios.get("https://registry.npmjs.org/" + pkg);
        latestVersion = npmData.data["dist-tags"]?.latest || "unknown";
      } catch (npmErr) {
        console.warn("NPM registry error for " + pkg + ":", npmErr.message);
        // latestVersion remains "unknown"
      }

      // Fetch vulnerabilities from OSV API
      let vulnerabilities = 0;
      try {
        // Sanitize version string for OSV - keep digits and dots only, but ensure no empty string
        let sanitizedVersion = version.replace(/[^\d.]/g, '');
        if (!sanitizedVersion || sanitizedVersion.trim() === '') {
          console.warn("Sanitized version is empty for package " + pkg + ", original version: \"" + version + "\"");
          sanitizedVersion = version; // fallback to original version, may or may not work
        }
        const osvResponse = await axios.post('https://api.osv.dev/v1/query', {
          package: { name: pkg, ecosystem: 'npm' },
          version: sanitizedVersion
        });
        console.log("OSV API response for " + pkg + "@" + sanitizedVersion + ":", osvResponse.data);
        if (osvResponse.data && Array.isArray(osvResponse.data.vulns)) {
          vulnerabilities = osvResponse.data.vulns.length;
        } else {
          console.warn("OSV API response for " + pkg + " missing or invalid 'vulns' array.");
          vulnerabilities = 0;
        }
      } catch (osvErr) {
        console.warn("OSV API error for " + pkg + ":", osvErr.message);
        vulnerabilities = 0; // ensure default numeric value
      }

      const outdated = version.replace(/[^\d.]/g, '') !== latestVersion;
      const healthScore = calculateHealthScore(vulnerabilities, outdated);
      const riskLevel =
        healthScore >= 80 ? "Low" : healthScore >= 50 ? "Medium" : "High";

      const dep = new Dependency({
        name: pkg,
        version,
        latestVersion,
        vulnerabilities,
        healthScore,
        riskLevel,
      });

      // Try to save to DB, but if fails (e.g., no DB connection), still include in results
      try {
        await dep.save();
        results.push({
          name: pkg,
          version: version,
          latestVersion: latestVersion,
          vulnerabilities: vulnerabilities,
          healthScore: healthScore,
          riskLevel: riskLevel,
        });
      } catch (saveErr) {
        console.warn("DB save error for " + pkg + ":", saveErr.message);
        results.push({
          name: pkg,
          version: version,
          latestVersion: latestVersion,
          vulnerabilities: vulnerabilities,
          healthScore: healthScore,
          riskLevel: riskLevel,
        }); // Push unsaved dep as plain object with expected fields
      }
    }

    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error analyzing dependencies" });
  }
};

export const getDependencies = async (req, res) => {
  try {
    const deps = await Dependency.find();
    res.status(200).json(deps);
  } catch (err) {
    res.status(500).json({ message: "Error fetching data" });
  }
};
