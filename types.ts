import { GoogleGenAIOptions, LiveClientToolResponse, LiveServerMessage, Part } from "@google/genai";

export enum AppStage {
  INTRO,
  DREAM_INPUT,
  ANALYSIS,
  RECREATION,
  DREAM_ANALYSIS,
}

export enum MessageAuthor {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessage {
  author: MessageAuthor;
  text: string;
  suggestions?: string[];
  context?: string[];
  functionId?: string;
}

export interface ParsedAiResponse {
  question: string;
  suggestions: string[];
  context?: string[];
  recreationReady?: boolean;
}

export interface DreamAnalysis {
  dreamSummary: string;
  psychologicalMeaning: string;
  symbols: Array<{
    symbol: string;
    meaning: string;
  }>;
  emotionalThemes: string[];
  recommendations: string[];
  overallInterpretation: string;
}


/**
 * the options to initiate the client, ensure apiKey is required
 */
export type LiveClientOptions = GoogleGenAIOptions & { apiKey: string };

/** log types */
export type StreamingLog = {
  date: Date;
  type: string;
  count?: number;
  message:
  | string
  | ClientContentLog
  | Omit<LiveServerMessage, "text" | "data">
  | LiveClientToolResponse;
};

export type ClientContentLog = {
  turns: Part[];
  turnComplete: boolean;
};