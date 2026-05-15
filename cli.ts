import { generateTargetedProblem, DEFAULT_SYSTEM_PROMPT } from './llm_route.ts';
import { ALL_TOPICS, ALL_DIFFICULTIES, type MathTopic, type Difficulty } from './types_1.ts';
import { gradeSingleProblem, exportGradingResultsToCsv, getNextBatchId } from './grader.ts';
import { editSystemPrompt, logPromptToCsv, getLatestSystemPrompt } from './prompt_editor.ts';
import * as readline from 'readline';
import * as fs from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise(resolve => rl.question(query, resolve));
};

interface BenchmarkProblem {
  id: string;
  topic: MathTopic;
  difficulty: Difficulty;
}

const getRandomItem = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

function loadOrGenerateBenchmarkSuite(size: number): BenchmarkProblem[] {
  const filePath = './benchmark_suite.json';
  
  if (fs.existsSync(filePath)) {
    console.log(`\n✓ Found existing benchmark suite. Loading fixed problems...`);
    const rawData = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(rawData);
  }

  console.log(`\n! No benchmark suite found. Generating a new locked suite of ${size} problems...`);
  const suite: BenchmarkProblem[] = [];
  
  for (let i = 1; i <= size; i++) {
    suite.push({
      id: `bench_q${i}`,
      topic: getRandomItem(ALL_TOPICS),
      difficulty: getRandomItem(ALL_DIFFICULTIES)
    });
  }

  fs.writeFileSync(filePath, JSON.stringify(suite, null, 2));
  console.log(`✓ Benchmark suite saved to ${filePath}`);
  return suite;
}

async function runPipeline() {
  console.log('Math Problem Paired-Benchmark CLI');
  console.log('=============================================');

  try {
    const numBatchesInput = await askQuestion('How many iterative batches do you want to run? ');
    const numBatches = parseInt(numBatchesInput, 10);

    let suiteSize = 40; // Default size
    if (!fs.existsSync('./benchmark_suite.json')) {
      const suiteSizeInput = await askQuestion('Create new benchmark suite. How many fixed problems per batch? (e.g., 40): ');
      suiteSize = parseInt(suiteSizeInput, 10);
    }

    if (isNaN(numBatches) || numBatches < 1 || isNaN(suiteSize) || suiteSize < 1) {
      console.error('Invalid inputs. Please enter valid numbers.');
      rl.close();
      return;
    }

    // Load our static configurations
    const benchmarkSuite = loadOrGenerateBenchmarkSuite(suiteSize);

    let currentBatchId = getNextBatchId('./grading_results.csv');
    let currentSystemPrompt = getLatestSystemPrompt(DEFAULT_SYSTEM_PROMPT);

    console.log(`\nStarting pipeline at Batch ID: ${currentBatchId}`);
    console.log(`Each batch will test ${benchmarkSuite.length} identical configurations.`);

    for (let b = 1; b <= numBatches; b++) {
      console.log(`\n=============================================`);
      console.log(`[BATCH ${currentBatchId}] (${b}/${numBatches})`);
      console.log(`=============================================`);
      
      logPromptToCsv(currentBatchId, currentSystemPrompt);
      console.log(`✓ Prompt saved to prompts.csv`);

      const batchEvaluations = [];

      for (let p = 0; p < benchmarkSuite.length; p++) {
        const target = benchmarkSuite[p];
        try {
          console.log(`\n  [Problem ${p+1}/${benchmarkSuite.length}] Generating [${target.id}: ${target.topic}]...`);
          // Note we are passing target.id here!
          const problem = await generateTargetedProblem(target.topic, target.difficulty, target.id, 'cli', currentSystemPrompt);
          console.log(`  ✓ Generated.`);

          console.log(`  [Problem ${p+1}/${benchmarkSuite.length}] Grading...`);
          const evaluation = await gradeSingleProblem(problem);
          batchEvaluations.push(evaluation);
          
          exportGradingResultsToCsv([{ problemId: problem.id, evaluation }], './grading_results.csv', currentBatchId);
          console.log(`  ✓ Graded & Saved.`);
        } catch (error) {
          console.error(`  ✗ Error processing problem ${target.id}:`, error);
        }
      }

      console.log(`\n✓ Completed batch ${currentBatchId}.`);

      if (b < numBatches) {
        console.log(`Analyzing feedback to refine system prompt for next batch...`);
        const newPrompt = await editSystemPrompt(currentSystemPrompt, batchEvaluations);
        
        if (newPrompt !== currentSystemPrompt) {
          console.log(`✓ System prompt successfully updated by AI.`);
          currentSystemPrompt = newPrompt;
        } else {
          console.log(`- System prompt remained unchanged.`);
        }
      }

      currentBatchId++;
    }

    console.log('\nPipeline finished successfully.');
  } catch (error) {
    console.error('Fatal pipeline error:', error);
  } finally {
    rl.close();
  }
}

runPipeline();