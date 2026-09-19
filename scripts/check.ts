import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import fs from 'fs';
import path from 'path';
import { askGroq } from '../lib/groq';
import { SYSTEM_PROMPT } from '../config';
import { TEST_QUESTIONS } from '../tests/questions';

const EXACT_REFUSAL_PHRASE = "I cannot answer that"; 
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function runAcceptance() {
  const results = [];
  let score = 0;

  console.log("Starting Acceptance Runner...");
  console.log("-----------------------------\n");

  for (const q of TEST_QUESTIONS) {
    const payload = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: q.question }
    ];

    try {
      // @ts-ignore
      const reply = await askGroq(payload);
      const replyLower = reply.toLowerCase();
      
      let passed = false;
      
      if (q.expect === "answer") {
        passed = q.mustContain.every(term => 
          replyLower.includes(term.toLowerCase().trim())
        );
      } else if (q.expect === "refuse") {
        passed = replyLower.includes(EXACT_REFUSAL_PHRASE.toLowerCase());
      }

      if (passed) score++;

      console.log(`[${passed ? 'PASS' : 'FAIL'}] ${q.question}`);
      
      if (!passed) {
         const expected = q.expect === 'answer' ? q.mustContain.join(' AND ') : `Refusal: "${EXACT_REFUSAL_PHRASE}"`;
         console.log(`       -> Expected: ${expected}`);
         console.log(`       -> Got: ${reply.replace(/\n/g, ' ').substring(0, 100)}...`);
      }
      
      results.push({
        id: q.id,
        question: q.question,
        reply: reply,
        passed: passed
      });
    } catch (error) {
      console.log(`[ERROR] Failed to fetch reply for: ${q.question}`);
      console.error(error);
    }
    
    // Wait 3.5 seconds before asking the next question to avoid Groq rate limits
    await delay(3500);
  }

  console.log("\n-----------------------------");
  console.log(`Final Score: ${score} / 12`);

  const outputPath = path.join(process.cwd(), 'check-results.json');
  fs.writeFileSync(outputPath, JSON.stringify({ score, total: 12, results }, null, 2));
  console.log(`\nFull results written to ${outputPath}`);
}

runAcceptance();
