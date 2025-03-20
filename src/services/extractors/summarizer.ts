// src/services/extractors/summarizer.ts
import type { Document } from 'langchain/document';
import { loadSummarizationChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAI } from "@langchain/openai";
import { env } from '@/config/env.js';
import { type Result, err, ok } from 'neverthrow';

const DEFAULT_PROMPT = `Write a comprehensive summary of the following content.
Include all key information, people, attributes, metrics, and relationships.
Your summary should be 2-3 complete sentences and must not be cut off.
Content:
{text}
SUMMARY:`;

/**
 * Summarize a document using OpenAI
 */
export async function summarizeDocument(
  doc: Document,
  customPrompt?: string
): Promise<Result<string, Error>> {
  try {
    const model = new OpenAI({
      modelName: "gpt-3.5-turbo-instruct",
      temperature: 0.2,
      maxTokens: 500,
      openAIApiKey: env.OPENAI_API_KEY,
    });
    
    const promptTemplate = customPrompt || DEFAULT_PROMPT;
    const chain = loadSummarizationChain(model, {
      type: "stuff",
      prompt: PromptTemplate.fromTemplate(promptTemplate)
    });
    
    const result = await chain.invoke({
      input_documents: [doc],
    });
    
    return ok(result.text);
  } catch (error) {
    return err(new Error(`Failed to summarize document: ${error}`));
  }
}