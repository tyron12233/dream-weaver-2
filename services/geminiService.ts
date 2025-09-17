import { ChatMessage, DreamAnalysis } from '@/types';
import { GoogleGenAI, Chat, Modality } from '@google/genai';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const systemInstruction = `You are a gentle and insightful dream analyst called The Dream Weaver'. Your purpose is to help users explore their dreams. 
Your primary interaction is to ask clarifying, open-ended questions to understand the dream's atmosphere, key symbols, colors, and feelings.

Start by acknowledging the user's initial dream description and then ask your first question.
Keep your questions focused. Ask only one question at a time.


Before you start, wait for the [DREAM INPUT STAGE] signal from the user interface. This indicates the user is ready to share their dream. 
You will introduce yourself briefly and then wil prompt the user to describe their dream in detail.

After the user shares their dream, it will start with [DREAM DESCRRIPTION] and end with [END DREAM DESCRIPTION].

After that you will ask a series of 5-7 clarifying questions to understand the dream better.
You will use the function 'askUser' to ask each question. Before calling the function make sure to read it first.

ask user parameters:
- question: Your open-ended question about their dream. Keep it focused and clear.
- context: Additional context to help the user understand the question. This could include references to dream psychology concepts or examples of dream symbols.
- suggestions: A list of 3-5 suggested user responses to the question. 


If you feel like you have enough information to provide a meaningful analysis, you can end the questioning early.

Say that you will now provide a dream analysis and image generation based on the information gathered.

After all that and you want to provide a dream analysis, you will call the askUser again but instead of a question
you will say something like I have enough information to provide an analysis, Im going to proceed.

You will call askUser with the following added parameter
recreationReady: true

`;

export function createChatSession(): Chat {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
    },
  });
  return chat;
}

export async function summarizeForInitialImage(chatHistory: ChatMessage[]): Promise<string> {
  const conversation = chatHistory.map(msg => `${msg.author}: ${msg.text}`).join('\n');
  const summarizationSystemInstruction = `You are a surrealist artist's assistant. Read the following conversation between a dream analyst and a user. Based on this, write a single, detailed, visually rich paragraph for an image generation AI. Focus on key objects, the atmosphere, colors, and emotions to create an ethereal, dreamlike prompt. Do not add any other text. The style should be like a surreal, ethereal, dreamlike painting.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `CONVERSATION:\n${conversation}\n\n---\n\nIMAGE PROMPT:`,
    config: {
      systemInstruction: summarizationSystemInstruction,
    }
  });

  return response.text;
}
export async function generateInitialImage(prompt: string): Promise<{ data: string; mimeType: string }> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: `A surreal, ethereal, dreamlike painting of: ${prompt}. Square composition. Rich textures. Soft light.`,
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/jpeg',
      };
    }
  }

  throw new Error('No image returned from gemini-2.5-flash-image-preview');
}

export function createEditPrompt(lastUserMessage: ChatMessage, lastAiMessage: ChatMessage): string {
  return `Based on the last part of the conversation, edit the image. The user said: "${lastUserMessage.text}". The AI asked: "${lastAiMessage.text}". Make a subtle, surreal, and artistic change to the existing image that reflects this new information. For example, if they talk about "flying", make the scene feel more airborne or add floating elements. If they talk about "shadows", deepen the mysterious tones.`;
}


export async function editImage(
  previousImage: { data: string; mimeType: string },
  prompt: string
): Promise<{ data: string; mimeType: string } | null> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: previousImage.data,
            mimeType: previousImage.mimeType,
          },
        },
        {
          text: prompt,
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType || 'image/jpeg',
      };
    }
  }
  return null;
}

export async function generateDreamAnalysis(chatHistory: ChatMessage[]): Promise<DreamAnalysis> {
  const conversation = chatHistory.map(msg => `${msg.author}: ${msg.text}`).join('\n');

  // Extract dream context for personalization
  const dreamContext = chatHistory
    .filter(msg => msg.context)
    .flatMap(msg => msg.context!)
    .join(', ');

  const analysisSystemInstruction = `You are Dr. Oneiros, a renowned dream psychologist and analyst. Based on the provided conversation between a dream analyst and a user, create a comprehensive and HIGHLY PERSONALIZED dream analysis.

Key Context Elements from the Dream: ${dreamContext}

Your response MUST be a valid JSON object with the following structure:
{
  "dreamSummary": "A vivid, engaging summary that references specific elements from their dream conversation. Make it feel like a personalized story, not generic text.",
  "psychologicalMeaning": "Deep psychological interpretation explaining why THIS SPECIFIC dream occurred to THIS person. Reference their specific symbols, emotions, and context.",
  "symbols": [
    {
      "symbol": "Specific symbol mentioned in their dream",
      "meaning": "Personalized interpretation based on how this symbol appeared in THEIR dream context"
    }
  ],
  "emotionalThemes": ["personalized", "emotional", "themes", "from", "their", "specific", "dream"],
  "recommendations": [
    "Highly specific advice based on their exact dream content and psychological interpretation",
    "Actionable insights tailored to their dream symbols and emotional themes"
  ],
  "overallInterpretation": "A comprehensive, personalized interpretation that feels like it was written specifically for this dreamer's unique experience. Reference their specific dream elements, emotions, and journey."
}

PERSONALIZATION REQUIREMENTS:
- Reference specific symbols, colors, emotions, or settings mentioned in their conversation
- Use language that reflects the dream's tone (mysterious, anxious, peaceful, etc.)
- Connect interpretations directly to elements they described
- Make recommendations feel tailored to their specific dream experience
- Avoid generic dream analysis - this should feel uniquely theirs

Focus on:
- Their specific dream symbols and how they appeared
- The emotional journey they described
- Connections between their dream elements and life themes
- Personalized growth insights based on their unique dream
- Making them feel understood and seen

Be insightful, compassionate, and deeply personal while remaining scientifically grounded.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `DREAM CONVERSATION:\n${conversation}\n\nDREAM CONTEXT ELEMENTS: ${dreamContext}\n\n---\n\nCREATE HIGHLY PERSONALIZED DREAM ANALYSIS:`,
    config: {
      systemInstruction: analysisSystemInstruction,
      responseMimeType: 'application/json',
    }
  });

  try {
    const analysis = JSON.parse(response.text) as DreamAnalysis;

    // Ensure we have at least some symbols
    if (!analysis.symbols || analysis.symbols.length === 0) {
      console.log('No symbols found in analysis, adding a default one for personalization.');
      analysis.symbols = [
        {
          symbol: "Dream Journey",
          meaning: "Your unique dream experience represents a personal exploration of your subconscious mind."
        }
      ];
    }


    console.log('Dream analysis generated:', analysis);

    return analysis;
  } catch (error) {
    console.error('Error parsing dream analysis:', error);
    // Enhanced fallback analysis with more personality
    return {
      dreamSummary: "Your dream unfolds like a unique tapestry of your subconscious mind, weaving together symbols, emotions, and experiences that are distinctly yours. Each element you described carries personal significance, creating a dreamscape that reflects your inner world and current life journey.",
      psychologicalMeaning: "Dreams serve as your mind's way of processing experiences, emotions, and thoughts that occupy your subconscious. Your particular dream suggests an active inner dialogue between your conscious and unconscious mind, working through themes that resonate with your current life situation.",
      symbols: [
        {
          symbol: "Your Dream Setting",
          meaning: "The environment and atmosphere of your dream reflects your emotional state and how you perceive your current life circumstances."
        },
        {
          symbol: "Dream Characters",
          meaning: "The people or figures in your dream often represent different aspects of yourself or significant relationships in your life."
        }
      ],
      emotionalThemes: ["self-discovery", "processing", "exploration", "reflection", "growth"],
      recommendations: [
        "Keep a dream journal to track recurring themes and patterns in your dream life",
        "Reflect on how the emotions in your dreams might relate to your waking life experiences",
        "Pay attention to symbols that repeat across different dreams, as they often carry important personal meaning",
        "Consider meditation or mindfulness practices to enhance your connection with your subconscious mind"
      ],
      overallInterpretation: "Your dream represents a beautiful window into your subconscious mind's active processing of life experiences. The unique combination of symbols, emotions, and scenarios you experienced suggests a rich inner life and a mind that is actively working through important themes. This dream invites you to pay attention to your inner wisdom and trust in your subconscious mind's ability to guide and support your personal growth journey."
    };
  }
}