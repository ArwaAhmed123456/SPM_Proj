import axios from "axios";
import Dependency from "../models/DependencyModel.js";
import Cache from "../models/CacheModel.js";
import { calculateHealthScore } from "../utils/healthScore.js";

import retry from 'async-retry';  

export const analyzeDependencies = async (req, res) => {
  const startTime = Date.now();
  try {
    console.log("DEBUG: analyzeDependencies called with req.body:", JSON.stringify(req.body));
    const { dependencies, packageJson, search_patterns } = req.body;
    let deps = {};
    if (packageJson && packageJson.dependencies && typeof packageJson.dependencies === 'object' && !Array.isArray(packageJson.dependencies)) {
      deps = packageJson.dependencies;
    } else if (dependencies && typeof dependencies === 'object' && !Array.isArray(dependencies)) {
      deps = dependencies;
    } else if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      deps = req.body;
    }

    // If search_patterns provided, filter dependencies keys accordingly (simulate filtering for demo)
    if (search_patterns && Array.isArray(search_patterns) && search_patterns.length > 0) {
             const patternRegexes = search_patterns.map(pattern => {
        // Convert simple glob patterns to regex, e.g. "*.js" -> /^.*\.js$/
        const regexStr = "^" + pattern.replace(/\./g, '\\.').replace(/\*/g, ".*") + "$";
        return new RegExp(regexStr);
      });
      deps = Object.fromEntries(
        Object.entries(deps).filter(([depName]) =>
          patternRegexes.some(regex => regex.test(depName))
        )
      );
    }

    if (Object.keys(deps).length === 0) {
      return res.status(200).json({ overallHealthScore: 100, dependencies: [] });
    }

    const results = [];
    const BATCH_SIZE = 3; // Reduced from 5 to 3 for improved performance
    const depEntries = Object.entries(deps);

    for (let i = 0; i < depEntries.length; i += BATCH_SIZE) {
      const batch = depEntries.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(([pkg, version]) =>
          retry(async bail => {
            // NPM Registry data with cache check
            let latestVersion = "unknown";
            try {
              const cachedNpm = await Cache.findOne({
                packageName: pkg,
                dataType: 'npm_registry',
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // cache valid for 24 hours
              });

              if (cachedNpm) {
                latestVersion = cachedNpm.value.latestVersion || "unknown";
              } else {
                const npmData = await axios.get("https://registry.npmjs.org/" + pkg, { timeout: 5000 }); // 5 second timeout
                latestVersion = npmData.data["dist-tags"]?.latest || "unknown";

                await Cache.create({
                  packageName: pkg,
                  dataType: 'npm_registry',
                  value: { latestVersion }
                });
              }
            } catch (npmErr) {
              console.warn("NPM registry error for " + pkg + ":", npmErr.message);
              // bail() to stop retry on permanent errors? Here we continue
            }

            // OSV Vulnerabilities with cache check
            let vulnerabilities = 0;
            try {
              let sanitizedVersion = version.replace(/[^\d.]/g, '');
              if (!sanitizedVersion || sanitizedVersion.trim() === '') {
                sanitizedVersion = version;
              }

              const cachedOsv = await Cache.findOne({
                packageName: pkg,
                dataType: 'osv_vulnerabilities',
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              });

              if (cachedOsv) {
                vulnerabilities = cachedOsv.value.vulnerabilities || 0;
              } else {
                const osvResponse = await axios.post('https://api.osv.dev/v1/query', {
                  package: { name: pkg, ecosystem: 'npm' },
                  version: sanitizedVersion
                }, { timeout: 5000 }); // 5 second timeout

                if (osvResponse.data && Array.isArray(osvResponse.data.vulns)) {
                  vulnerabilities = osvResponse.data.vulns.length;
                } else {
                  vulnerabilities = 0;
                }

                await Cache.create({
                  packageName: pkg,
                  dataType: 'osv_vulnerabilities',
                  value: { vulnerabilities }
                });
              }
            } catch (osvErr) {
              console.warn("OSV API error for " + pkg + ":", osvErr.message);
              vulnerabilities = 0;
            }

            const outdated = version.replace(/[^\d.]/g, '') !== latestVersion;
            const healthScore = calculateHealthScore(vulnerabilities, outdated);
            const riskLevel = healthScore >= 80 ? "Low" : healthScore >= 50 ? "Medium" : "High";

            try {
              // Save/update Dependency in DB - consider batching in future for optimization
              await Dependency.findOneAndUpdate(
                { name: pkg },
                {
                  name: pkg,
                  version,
                  latestVersion,
                  vulnerabilities,
                  healthScore,
                  riskLevel,
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
              );
            } catch (saveErr) {
              console.warn("DB save/update error for " + pkg + ":", saveErr.message);
            }

            return {
              name: pkg,
              version,
              latestVersion,
              vulnerabilities,
              healthScore,
              riskLevel,
            };
          }, {
            retries: 3,
            minTimeout: 500,
            onRetry: (e, attempt) => console.log(`Retrying ${pkg} (${attempt}/3) due to error: ${e.message}`)
          })
        )
      );

      results.push(...batchResults);
    }

    // Calculate weighted overall health score
    const totalDependencies = results.length;
    const overallHealthScore = totalDependencies
      ? Math.round(
          results.reduce((acc, dep) => acc + dep.healthScore * (dep.vulnerabilities + 1), 0) /
          results.reduce((acc, dep) => acc + (dep.vulnerabilities + 1), 0)
        )
      : 100;

    const analysisDurationMs = Date.now() - startTime;

    res.status(200).json({
      overallHealthScore,
      analysisDurationMs,
      dependencies: results,
    });

  } catch (err) {
    console.error("Error analyzing dependencies:", err);
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
