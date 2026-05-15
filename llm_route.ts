import type { MathTopic, Difficulty } from './types_1.ts';
import { type GraderProblem } from './grader_formatter.ts';

// Force dynamic to prevent static caching issues
export const dynamic = 'force-dynamic';
export const runtime = 'edge';
const API_KEY = "Shh... It's a secret!";
const DEFAULT_BATCH_SIZE = 1;
const MAX_BATCH_SIZE = 10;

const getRandomItem = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

// Default prompt exported so the CLI can use it as the starting baseline
export const DEFAULT_SYSTEM_PROMPT = `You are a mathematics professor. Respond with valid JSON only.
  FORMAT: { "topic": "topic-key", "difficulty": "easy|medium|hard", "question": "$$LaTeX$$", "solution": "Markdown" }
  RULES FOR QUESTION FIELD: Questions must be wrapped in $$...$$. If question is mixed with standard text, standard text should be above the LaTeX, which should be wrapped in $$...$$. Do not end with punctuation. Use colons to separate question text from the LaTeX if both are present.
  RULES FOR SOLUTION FIELD: Solution uses bold and numbered steps. Display in solution should be wrapped in $$...$$. Inline latex should be wrapped in $...$. A mix of text and LaTeX (display and inline) should be used in the solution to naturally explain the reasoning.
  Do NOT include any text outside the JSON.`;

const topicDescriptions: Record<string, string> = {
    'u-substitution': 'integral calculus using u-substitution',
    'integration-by-parts': 'integral calculus using integration by parts',
    // ... [KEEP ALL YOUR EXISTING TOPIC DESCRIPTIONS HERE] ...
    'linear-transformations': 'finding the matrix of a linear transformation and checking linearity',
    'kernel-and-range': 'finding the kernel and range of a linear transformation',
};

export async function generateTargetedProblem(
  topic: MathTopic,
  difficulty: Difficulty,
  targetId: string,
  sessionId?: string,
  customSystemPrompt?: string
): Promise<GraderProblem> {
  if (!API_KEY) {
    throw new Error("Server Configuration Error: API_KEY missing in Production");
  }

  const systemPrompt = customSystemPrompt || DEFAULT_SYSTEM_PROMPT;
  const userPrompt = `Generate a ${difficulty} problem about ${topic}.\nReturn ONLY valid JSON as an object with topic, difficulty, question, and solution fields.`;

  // Monkey-patch fetch to inject history (if any)
  const originalFetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
    try {
      const [input, init] = args;
      const url = typeof input === 'string'
        ? input
        : (input instanceof URL ? input.toString() : (input as Request).url);
      if (url.includes('deepseek.com/chat/completions') && init && (init as RequestInit).body) {
        const parsedBody = JSON.parse((init as RequestInit).body as string);
        if (Array.isArray(parsedBody.messages)) {
          parsedBody.messages = parsedBody.messages.map((m: any) => {
            if (m.role === 'user') {
              const topicDesc = (topicDescriptions as Record<string, string>)[topic] ?? topic;
              const injection = [
                `Topic description: ${topicDesc}.`,
                sessionId ? `Session ID: ${sessionId}.` : '',
              ].filter(Boolean).join('\n');
              m.content = `${m.content}\n\n${injection}`;
            }
            return m;
          });
          args[1] = { ...(init as RequestInit), body: JSON.stringify(parsedBody) };
        }
      }
    } catch {
      // ignore
    }
    return originalFetch(args[0] as any, args[1] as any);
  };

  const deepseekResponse = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!deepseekResponse.ok) {
    const errText = await deepseekResponse.text();
    throw new Error(`DeepSeek API Error: ${deepseekResponse.status} - ${errText}`);
  }

  const responseText = await deepseekResponse.text();
  let parsedResponse;
  try {
    const apiResponse = JSON.parse(responseText);
    if (apiResponse.choices && apiResponse.choices[0] && apiResponse.choices[0].message && apiResponse.choices[0].message.content) {
      const content = apiResponse.choices[0].message.content;
      parsedResponse = typeof content === 'string' ? JSON.parse(content) : content;
    } else {
      parsedResponse = apiResponse;
    }
  } catch (parseError) {
    throw new Error(`Invalid JSON response from LLM: ${responseText}`);
  }

  if (!parsedResponse.topic || !parsedResponse.difficulty || !parsedResponse.question || !parsedResponse.solution) {
    throw new Error(`Invalid problem format: missing required fields`);
  }

  return {
    id: targetId, // Use the fixed ID passed in for paired tracking
    question: parsedResponse.question,
    solution: parsedResponse.solution,
    topic: parsedResponse.topic,
    difficulty: parsedResponse.difficulty
  };
}

// --- REFACTORED ORIGINAL FUNCTION ---
export async function generateSingleProblem(
  topics: MathTopic[], 
  difficulties: Difficulty[], 
  sessionId?: string,
  customSystemPrompt?: string
): Promise<GraderProblem> {
  const selectedTopic = getRandomItem(topics);
  const selectedDifficulty = getRandomItem(difficulties);
  const randomId = `problem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  return generateTargetedProblem(selectedTopic, selectedDifficulty, randomId, sessionId, customSystemPrompt);
}

export async function POST(req: Request) {
  try {
    // 2. Parse Request
    const { topics, difficulties, batchSize } = await req.json() as { 
      topics: MathTopic[];
      difficulties: Difficulty[];
      batchSize?: number;
    };
    if (!Array.isArray(topics) || topics.length === 0 || !Array.isArray(difficulties) || difficulties.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid request: topics and difficulties must be non-empty arrays" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const normalizedBatchSize = Math.max(DEFAULT_BATCH_SIZE, Math.min(MAX_BATCH_SIZE, Math.floor(batchSize ?? DEFAULT_BATCH_SIZE)));
    const problems = [];

    for (let i = 0; i < normalizedBatchSize; i++) {
      const problem = await generateSingleProblem(topics, difficulties);
      problems.push(problem);
    }

    return new Response(JSON.stringify({ problems }), {
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error("General Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown Server Error" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}