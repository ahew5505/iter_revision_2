import * as fs from 'fs';
import type { GradingResult } from './grader.ts';

const API_KEY = "Shh... It's a secret!";

export function getLatestSystemPrompt(defaultPrompt: string): string {
  try {
    // Read from a dedicated active prompt file to avoid CSV parsing complexities
    if (fs.existsSync('./active_prompt.txt')) {
      return fs.readFileSync('./active_prompt.txt', 'utf-8');
    }
  } catch (e) {
    console.error("Error reading active_prompt.txt, falling back to default.", e);
  }
  return defaultPrompt;
}

export async function editSystemPrompt(
  currentPrompt: string, 
  evaluations: GradingResult['evaluation'][]
): Promise<string> {
  // Filter out any failed evaluations
  const validEvals = evaluations.filter((e): e is NonNullable<typeof e> => e !== null);
  
  if (validEvals.length === 0) {
    console.log("No valid evaluations to learn from in this batch. Keeping current prompt.");
    return currentPrompt;
  }

  // Compile the feedback from the batch
  const feedbackSummaries = validEvals.map((e, idx) => `
    Problem ${idx + 1} (${e.evaluation_metadata.topic_route} - ${e.problem_metadata.problem_difficulty}):
    - Correctness Score: ${e.scores.correctness}/4
    - Formatting Score: ${e.scores.formatting}/4
    - Pedagogy Score: ${e.summary_metrics.pedagogy_subscore_avg}/4
    - Primary Weakness: ${e.qualitative_analysis.primary_weakness}
    - Suggestion: ${e.qualitative_analysis.prompt_improvement_suggestion}
  `).join('\n');

  const editorSystemInstruction = `You are an expert AI Prompt Engineer specializing in educational math tools. 
Your job is to optimize a system prompt used to generate math problems and solutions. 
Review the "Current Prompt" and the "Feedback" provided by the grading system. 
Rewrite the Current Prompt to fix the weaknesses mentioned in the feedback while preserving the core rules and formatting constraints. 
Return ONLY a valid JSON object in this format: { "revised_prompt": "your new prompt text here" }`;

  const userPrompt = `CURRENT PROMPT:\n${currentPrompt}\n\nFEEDBACK FROM LAST BATCH:\n${feedbackSummaries}`;

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
        { role: 'system', content: editorSystemInstruction },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Editor API Error: ${response.status} - ${errText}. Falling back to previous prompt.`);
    return currentPrompt;
  }

  const responseText = await response.text();
  try {
    const apiResponse = JSON.parse(responseText);
    let content;
    if (apiResponse.choices && apiResponse.choices[0] && apiResponse.choices[0].message) {
      content = apiResponse.choices[0].message.content;
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      return parsedContent.revised_prompt || currentPrompt;
    }
    return currentPrompt;
  } catch (error) {
    console.error(`Failed to parse revised prompt from LLM. Falling back to previous prompt. Error:`, error);
    return currentPrompt;
  }
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const escaped = String(value).replace(/"/g, '""');
  return `"${escaped}"`;
}

export function logPromptToCsv(batchId: number, prompt: string, csvFilePath = './prompts.csv'): void {
  // 1. Log to CSV
  let fileExists = false;
  try {
    fs.accessSync(csvFilePath, fs.constants.F_OK);
    fileExists = true;
  } catch {
    fileExists = false;
  }

  const row = `"${batchId}",${csvEscape(prompt)}`;
  const fileContent = fileExists ? `\n${row}` : `"batch_id","system_prompt"\n${row}`;
  
  fs.writeFileSync(csvFilePath, fileContent, { encoding: 'utf-8', flag: 'a' });

  // 2. Update the active prompt file so the next session can easily resume
  fs.writeFileSync('./active_prompt.txt', prompt, { encoding: 'utf-8' });
}