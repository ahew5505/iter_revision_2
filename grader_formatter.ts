export interface GraderProblem {
  id: string;
  question: string;
  solution: string;
  topic: string;
  difficulty: string;
}

export interface GraderInput {
  problems: GraderProblem[];
}

function tryParseJson(value: any): any {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    const trimmed = value.trim();
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedMatch) {
      try {
        return JSON.parse(fencedMatch[1]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function extractProblems(response: any): any[] | undefined {
  if (!response) {
    return undefined;
  }

  if (Array.isArray(response.problems)) {
    return response.problems;
  }

  if (response.output) {
    const extracted = extractProblems(response.output);
    if (Array.isArray(extracted)) {
      return extracted;
    }
  }

  if (Array.isArray(response.choices)) {
    for (const choice of response.choices) {
      const content = choice.message?.content ?? choice.output ?? choice.delta?.content ?? choice.content;
      const parsed = tryParseJson(content);
      const problems = extractProblems(parsed ?? content);
      if (Array.isArray(problems)) {
        return problems;
      }
    }
  }

  if (typeof response === 'string') {
    const parsed = tryParseJson(response);
    if (parsed && parsed !== response) {
      return extractProblems(parsed);
    }
  }

  return undefined;
}

export function formatForGrader(llmResponse: any): GraderInput {
  const problems = extractProblems(llmResponse);
  if (!Array.isArray(problems)) {
    throw new Error(`Invalid LLM response format: ${JSON.stringify(llmResponse).slice(0, 500)}`);
  }

  return {
    problems: problems.map((p: any, index: number) => ({
      id: `problem_${index + 1}`,
      question: p.question,
      solution: p.solution,
      topic: p.topic,
      difficulty: p.difficulty
    }))
  };
}