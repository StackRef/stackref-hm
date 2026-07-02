const processAnalysisResults = (results) => {
  const resultsJson = results.team_analysis_result_json;

  if (results.team_analysis_result_source === 'snyk') {
    return processSynkResults(resultsJson);
  }

  if (results.team_analysis_result_source === 'cloc') {
    return processClocResults(resultsJson);
  }
};

const processSynkResults = (results) => {
  let score = 0;
  results.runs.forEach((run) => {
    run.results.forEach((result) => {
      score = score + result.properties?.priorityScore;
    });
  });
  return score;
};

const processClocResults = (results) => {
  results.runs.forEach((run) => {
    run.results.forEach((result) => {
      score = score + result.properties?.priorityScore;
    });
  });
  return score;
};

export default processAnalysisResults;
