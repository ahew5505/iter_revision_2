# MathTrain — Iterative Prompt Revision Pipeline (P2)
 
## Overview
 
This repository contains the source code and data for **"Iterative Prompt Revision - A Matter of Difficulty"** by Andrew Hewitt (2026). Building on the framework established in P1, this paper introduces a fully automated CLI pipeline for iterative prompt revision, applies paired testing to control for variability, and analyzes overcorrection patterns across 20 batches of 40 problems each (769 total graded responses).
 
The prompt identified as optimal in this study has been deployed to [mathtrain.app](https://mathtrain.app).
 
## Research Questions
 
- Is there a detectable pattern in overcorrection (oscillation, singular peak, etc.)?
- What are the characteristics of pedagogical score fluctuations across batches?
- What causes errors (data loss) in problem generation?
## Key Findings
 
- **Overcorrection has no regular period** — large score increases are typically followed by equally large decreases, but the behavior is reactionary rather than cyclic.
- **Score and standard deviation are strongly inversely correlated** (r = -0.748) — higher-scoring prompts also produce more consistent responses.
- **Prompt length does not significantly affect score or data loss** (r ≈ 0.047 and 0.065 respectively).
- **Problem difficulty is the primary driver of JSON formatting failures** — hard problems require complex multi-step reasoning that competes with strict formatting compliance.
- **Batch 2's prompt** was selected for production: it has the second-lowest standard deviation (highest consistency), the third-highest mean score, and a 0% failure rate.
## Pipeline Architecture
 
The pipeline is composed of five TypeScript modules:
 
| File | Role |
|---|---|
| `cli.ts` | Entry point. Orchestrates batch generation, grading, and prompt revision in a loop |
| `llm_route.ts` | Calls DeepSeek to generate math problems given a topic, difficulty, and system prompt |
| `grader.ts` | Calls DeepSeek to grade each generated response against the rubric; exports results to CSV |
| `grader_formatter.ts` | Parses and normalizes raw LLM responses into a structured grading input format |
| `prompt_editor.ts` | Feeds batch feedback into a revision LLM to produce an updated system prompt |
| `types_1.ts` | Type definitions for topics, difficulties, problems, and topic groupings |
 
### How It Works
 
1. On first run, the CLI generates a **locked benchmark suite** (`benchmark_suite.json`) — a fixed set of topic/difficulty pairs used identically across all batches (paired testing).
2. Each batch generates responses for every problem in the suite using the current system prompt.
3. Responses are graded one-by-one against `rubric.txt`. Scores and qualitative feedback are appended to `grading_results.csv`.
4. The current prompt is logged to `prompts.csv` and saved to `active_prompt.txt`.
5. After each batch (except the last), grading feedback is sent to a prompt-revision LLM, which rewrites the system prompt for the next batch.
6. The loop repeats for the requested number of batches.
### Running the Pipeline
 
```bash
npx ts-node cli.ts
```
 
You will be prompted for:
- Number of iterative batches to run
- Benchmark suite size (first run only — subsequently loads from `benchmark_suite.json`)
> **Tip:** Disable automatic sleep on your machine during large generation sessions to prevent interruptions.
 
## Repository Contents
 
| File | Description |
|---|---|
| `cli.ts` | Pipeline entry point (CLI) |
| `llm_route.ts` | Problem generation module |
| `grader.ts` | Grading and CSV export module |
| `grader_formatter.ts` | LLM response normalization |
| `prompt_editor.ts` | Automated prompt revision module |
| `types_1.ts` | Shared type definitions |
| `rubric.txt` | Pedagogical grading rubric (10 criteria, 0–4 scale) |
| `grading_results.csv` | Full grading dataset (769 responses across 20 batches) |
| `prompts.csv` | System prompt used for each batch |
| `Iterative_Prompt_Revision_-_A_Matter_of_Difficulty.pdf` | Full research paper |
 
## Known Limitations
 
- The pipeline does not currently handle JSON formatting errors from the LLM gracefully — malformed responses are silently dropped, causing data loss (31 of 800 expected responses in this study).
- The revision LLM has no memory of prior prompts, meaning it may repeat mistakes from earlier iterations. A context management protocol is identified as the natural next step.
## Further Research
 
Future directions include comparing response quality across different LLM combinations (e.g., Gemini for generation, Claude for revision, ChatGPT for grading), and building a context-aware revision layer so the editing model can learn from the full prompt history rather than just the most recent batch.
 
## References
 
- Tripathi, V., Allu, U., & Ahmed, B. (2025). *The Instruction Gap: LLMs get lost in Following Instruction.* arXiv. https://doi.org/10.48550/arxiv.2601.03269
- Liu, N. F., et al. (2024). *Lost in the Middle: How language models use long contexts.* Transactions of the Association for Computational Linguistics, 12, 157–173. https://doi.org/10.1162/tacl_a_00638
