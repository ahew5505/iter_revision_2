import type { GraderInput, GraderProblem } from './grader_formatter.ts';
import * as fs from 'fs';

const API_KEY = "Shh... It's a secret!";
const RUBRIC_PROMPT = fs.readFileSync('./rubric.txt', 'utf-8');

export interface GradingResult {
  problemId: string;
  evaluation: {
    evaluation_metadata: {
      topic_route: string;
      iteration_id: string;
    };
    problem_metadata: {
      problem_type: string;
      problem_difficulty: string;
      answer_correctness: number;
    };
    scores: {
      correctness: number;
      notation_standards: number;
      constraint_adherence: number;
      hallucination_check: number;
      step_by_step_logic: number;
      conceptual_bridging: number;
      method_consistency: number;
      jargon_management: number;
      conciseness_verbosity: number;
      formatting: number;
    };
    summary_metrics: {
      total_points: number;
      percentage: number;
      pedagogy_subscore_avg: number;
    };
    qualitative_analysis: {
      primary_strength: string;
      primary_weakness: string;
      prompt_improvement_suggestion: string;
    };
  } | null;
}

export async function gradeSingleProblem(problem: GraderProblem): Promise<GradingResult['evaluation']> {
  const userPrompt = `Grade this math problem solution:

Question: ${problem.question}
Solution: ${problem.solution}
Topic: ${problem.topic}
Difficulty: ${problem.difficulty}

Iteration ID: ${problem.id}`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: RUBRIC_PROMPT },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API Error: ${response.status} - ${errText}`);
  }

  const responseText = await response.text();
  let parsedResponse;
  try {
    const apiResponse = JSON.parse(responseText);
    // Extract the evaluation from the DeepSeek API response structure
    if (apiResponse.choices && apiResponse.choices[0] && apiResponse.choices[0].message && apiResponse.choices[0].message.content) {
      const content = apiResponse.choices[0].message.content;
      parsedResponse = typeof content === 'string' ? JSON.parse(content) : content;
    } else {
      parsedResponse = apiResponse;
    }
  } catch (parseError) {
    throw new Error(`Invalid JSON response from grading LLM: ${responseText}`);
  }

  return parsedResponse;
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const escaped = String(value).replace(/"/g, '""');
  return `"${escaped}"`;
}

// Replace this function in grader.ts
export function getNextBatchId(csvFilePath: string): number {
  try {
    fs.accessSync(csvFilePath, fs.constants.F_OK);
  } catch {
    return 1;
  }

  const content = fs.readFileSync(csvFilePath, 'utf-8').trim();
  if (!content) {
    return 1;
  }

  const lines = content.split(/\r?\n/);
  let maxBatchId = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i].trim();
    if (!row) continue;
    
    // Strip the quotes before converting to a Number
    const firstCol = row.split(',')[0].replace(/"/g, '');
    const rawBatchId = Number(firstCol);
    
    // If the line has internal newlines from the qualitative analysis, 
    // rawBatchId will safely evaluate to NaN and be skipped.
    if (!Number.isNaN(rawBatchId) && rawBatchId > maxBatchId) {
      maxBatchId = rawBatchId;
    }
  }

  return maxBatchId + 1;
}

function getCsvHeader(): string {
  return [
    'batch_id',
    'problem_id',
    'topic_route',
    'iteration_id',
    'problem_type',
    'problem_difficulty',
    'answer_correctness',
    'correctness',
    'notation_standards',
    'constraint_adherence',
    'hallucination_check',
    'step_by_step_logic',
    'conceptual_bridging',
    'method_consistency',
    'jargon_management',
    'conciseness_verbosity',
    'formatting',
    'total_points',
    'percentage',
    'pedagogy_subscore_avg',
    'primary_strength',
    'primary_weakness',
    'prompt_improvement_suggestion'
  ].map(csvEscape).join(',');
}

function gradingResultToCsvRow(batchId: number, result: GradingResult): string {
  const evaluation = result.evaluation;
  if (!evaluation) {
    return [
      batchId,
      result.problemId,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ].map(csvEscape).join(',');
  }

  return [
    batchId,
    result.problemId,
    evaluation.evaluation_metadata.topic_route,
    evaluation.evaluation_metadata.iteration_id,
    evaluation.problem_metadata.problem_type,
    evaluation.problem_metadata.problem_difficulty,
    evaluation.problem_metadata.answer_correctness,
    evaluation.scores.correctness,
    evaluation.scores.notation_standards,
    evaluation.scores.constraint_adherence,
    evaluation.scores.hallucination_check,
    evaluation.scores.step_by_step_logic,
    evaluation.scores.conceptual_bridging,
    evaluation.scores.method_consistency,
    evaluation.scores.jargon_management,
    evaluation.scores.conciseness_verbosity,
    evaluation.scores.formatting,
    evaluation.summary_metrics.total_points,
    evaluation.summary_metrics.percentage,
    evaluation.summary_metrics.pedagogy_subscore_avg,
    evaluation.qualitative_analysis.primary_strength,
    evaluation.qualitative_analysis.primary_weakness,
    evaluation.qualitative_analysis.prompt_improvement_suggestion
  ].map(csvEscape).join(',');
}

export function exportGradingResultsToCsv(results: GradingResult[], csvFilePath = './grading_results.csv', existingBatchId?: number): number {
  let batchId: number;
  
  if (existingBatchId !== undefined) {
    // Use existing batch ID for consistency across multiple calls
    batchId = existingBatchId;
  } else {
    // Get next batch ID if not provided
    batchId = getNextBatchId(csvFilePath);
  }
  
  let fileExists = false;
  try {
    fs.accessSync(csvFilePath, fs.constants.F_OK);
    fileExists = true;
  } catch {
    fileExists = false;
  }
  const rows = results.map((result) => gradingResultToCsvRow(batchId, result));
  const fileContent = fileExists ? '\n' + rows.join('\n') : getCsvHeader() + '\n' + rows.join('\n');
  fs.writeFileSync(csvFilePath, fileContent, { encoding: 'utf-8', flag: 'a' });
  return batchId;
}

export async function gradeProblems(input: GraderInput): Promise<GradingResult[]> {
  const results: GradingResult[] = [];

  for (const problem of input.problems) {
    try {
      const evaluation = await gradeSingleProblem(problem);
      results.push({ problemId: problem.id, evaluation });
    } catch (error) {
      console.error(`Error grading problem ${problem.id}:`, error);
      results.push({ problemId: problem.id, evaluation: null });
    }
  }

  return results;
}