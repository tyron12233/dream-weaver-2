import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { gsap } from 'gsap';
import { Behavior, FunctionCallingConfigMode, FunctionDeclaration, MediaResolution, Modality, Type, type Chat, type GenerateContentResponse } from '@google/genai';

import { AppStage, MessageAuthor } from './types';
import type { ChatMessage, ParsedAiResponse, DreamAnalysis } from './types';
import { createChatSession, createEditPrompt, editImage, generateInitialImage, summarizeForInitialImage, generateDreamAnalysis, systemInstruction } from './services/geminiService';

import Intro from './components/Intro';
import DreamInput from './components/DreamInput';
import ChatInterface from './components/ChatInterface';
import Dreamscape from './components/Dreamscape';
import DreamAnalysisView from './components/DreamAnalysisView';
import DynamicBackground from './components/DynamicBackground';
import { speechService } from './services/speechService';
import { useLiveAPI } from './hooks/useLiveApi';
import { useLiveAPIContext } from './contexts/LiveAPIContext';


const declaration: FunctionDeclaration = {
  name: "displayQuestion",
  parameters: {
    type: Type.OBJECT,
    properties: {
      "question": { type: Type.STRING, description: "The AI's next question to the user about their dream." },
      "context": { type: Type.STRING, description: "Additional context or information to help the user understand the question." },
      "suggestions": { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of suggested user responses to the question." },
      "recreationReady": { type: Type.BOOLEAN, description: "Indicates if enough information has been gathered to recreate the dream visually." }
    }
  },
  behavior: Behavior.BLOCKING,
  description: "A function to display the question the AI wants to ask the user about their dream.",
  response: {
    type: Type.OBJECT,
    properties: {
      "answer": { type: Type.BOOLEAN, description: "Wether it was displayed successfully." }
    },
  }
}


const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.INTRO);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRecreationReady, setIsRecreationReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [dreamAnalysis, setDreamAnalysis] = useState<DreamAnalysis | null>(null);

  const [finalDreamImageUrl, setFinalDreamImageUrl] = useState<string | null>(null);
  const [evolvingImageUrl, setEvolvingImageUrl] = useState<string | null>(null);
  const [currentImageData, setCurrentImageData] = useState<{ data: string; mimeType: string; } | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const currentFunctionCallId = useRef<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);

  const [started, setStarted] = useState(false);

  useEffect(() => {
    (window as any).messages = messages;
  }, [messages])

  useEffect(() => {
    (window as any).client = client;
  }, [])

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);


  const {

    client,
    config,
    connect,
    connected,
    disconnect,
    model,
    setModel,
    setConfig,
    volume
  } = useLiveAPIContext();


  useEffect(() => {
    setModel("models/gemini-2.5-flash-live-preview");
    setConfig({
      responseModalities: [Modality.AUDIO],
      mediaResolution: MediaResolution.MEDIA_RESOLUTION_LOW,


      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
      },
      systemInstruction: {
        parts: [{
          text: systemInstruction,
        }]
      },
      tools: [
        {
          functionDeclarations: [declaration],
        }
      ]
    });

    client.on('toolcall', (toolCall) => {
      console.log("Tool call received", toolCall);
      const functionCall = toolCall.functionCalls[0];
      if (functionCall.name === "displayQuestion") {
        currentFunctionCallId.current = functionCall.id;
        const args = functionCall.args as unknown as ParsedAiResponse;
        handleApiResponse(JSON.stringify(args));

        console.log("sending tool response");
        client.sendToolResponse({
          functionResponses: [
            {
              name: functionCall.name,
              id: functionCall.id,
              response: {
                answer: true
              }
            }
          ]
        })
      }
    });

    return () => {
      client.off('toolcall');
      client.disconnect();
    }
  }, []);


  useEffect(() => {
    if (!started) return;


    connect();


    return () => {
      disconnect().catch(console.error);
    };
  }, [started]);


  useEffect(() => {
    const updateDreamImage = async () => {
      if (isLoading || isGeneratingImage || stage !== AppStage.ANALYSIS || messages.length < 2) {
        return;
      }

      setIsGeneratingImage(true);
      try {
        let newImageData: { data: string; mimeType: string; } | null = null;

        if (!currentImageData) {
          const prompt = await summarizeForInitialImage(messages.slice(0, 2));
          newImageData = await generateInitialImage(prompt);
        } else {
          const lastUserMessage = messages.slice().reverse().find(m => m.author === MessageAuthor.USER);
          const lastAiMessage = messages.slice().reverse().find(m => m.author === MessageAuthor.AI);

          if (lastUserMessage && lastAiMessage) {
            const prompt = createEditPrompt(lastUserMessage, lastAiMessage);
            newImageData = await editImage(currentImageData, prompt);
          }
        }

        if (newImageData) {
          const imageUrl = `data:${newImageData.mimeType};base64,${newImageData.data}`;
          setCurrentImageData(newImageData);
          setEvolvingImageUrl(imageUrl);
          setFinalDreamImageUrl(imageUrl);
        }

      } catch (error) {
        console.error("Failed to generate or edit dream image:", error);
      } finally {
        setIsGeneratingImage(false);
      }
    };

    updateDreamImage();
  }, [messages]);

  const transitionTo = (newStage: AppStage) => {
    const container = contentRef.current;
    if (!container) {
      setStage(newStage);
      return;
    }

    const ctx = gsap.context(() => {
      const elements = Array.from(container.querySelectorAll('[data-transition-target]')) as HTMLElement[];

      // Fallback: if no targets found, animate the container itself
      if (!elements.length) {
        gsap.to(container, {
          opacity: 0,
          y: -10,
          duration: 0.25,
          ease: 'power2.in',
          onComplete: () => {
            gsap.set(container, { clearProps: 'all' });
            setStage(newStage);
          }
        });
        return;
      }

      gsap.to(elements.reverse(), {
        opacity: 0,
        y: -30,
        skewX: '5deg',
        duration: 0.4,
        stagger: 0.07,
        ease: 'power3.in',
        onComplete: () => {
          // Reset props on old elements, then switch stage so new elements can animate in smoothly
          gsap.set(elements, { clearProps: 'all' });
          setStage(newStage);
        },
      });
    }, container);

    // Clean up any inline styles if the component unmounts mid-animation
    return () => ctx.revert();
  };

  // Animate new stage content in
  useLayoutEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const elements = Array.from(container.querySelectorAll('[data-transition-target]')) as HTMLElement[];

      if (!elements.length) {
        // Fallback: animate container in
        gsap.from(container, {
          opacity: 0,
          y: 10,
          duration: 0.3,
          ease: 'power2.out',
        });
        return;
      }

      // Ensure initial state before paint, then animate to natural state
      gsap.set(elements, { opacity: 0, y: 30, skewX: '-5deg' });
      gsap.to(elements, {
        opacity: 1,
        y: 0,
        skewX: 0,
        duration: 0.6,
        stagger: 0.07,
        ease: 'power3.out',
        delay: 0.05,
      });
    }, container);

    return () => ctx.revert();
  }, [stage]);

  const handleApiResponse = (text: string) => {
    try {
      const parsed: ParsedAiResponse = JSON.parse(text);
      const aiResponse: ChatMessage = {
        author: MessageAuthor.AI,
        text: parsed.question,
        suggestions: parsed.suggestions,
        context: parsed.context,
      };
      setMessages(prev => [...prev, aiResponse]);

      if (parsed.recreationReady) {
        setIsRecreationReady(true);
        setTimeout(async () => {
          try {
            setIsLoading(true);
            console.log("GEnerating dream analysis for messages:", messagesRef.current);
            const analysis = await generateDreamAnalysis(messagesRef.current);
            setDreamAnalysis(analysis);
            transitionTo(AppStage.DREAM_ANALYSIS);
          } catch (error) {
            console.error("Failed to generate dream analysis:", error);
            // Fallback to recreation if analysis fails
            transitionTo(AppStage.RECREATION);
          } finally {
            setIsLoading(false);
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      const errorMessage: ChatMessage = {
        author: MessageAuthor.AI,
        text: "I'm sorry, my connection to the dream world is a bit hazy right now. Please try again later.",
        suggestions: ["Let's try again"]
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleDreamSubmit = async (dream: string) => {
    transitionTo(AppStage.ANALYSIS);
    setIsLoading(true);

    const firstUserMessage: ChatMessage = { author: MessageAuthor.USER, text: dream };
    setMessages([firstUserMessage]);

    client.send({ text: "[DREAM DESCRIPTION] " + dream + ". [END DESCRIPTION] [ASK QUESTION]" });

    // try {
    //   chatRef.current = createChatSession();
    //   const response = await chatRef.current.sendMessage({ message: dream });
    //   handleApiResponse(response.text);
    // } catch (error) {
    //   console.error("Failed to get response from Gemini:", error);
    //   const errorMessage: ChatMessage = {
    //     author: MessageAuthor.AI,
    //     text: "I'm sorry, my connection to the dream world is a bit hazy right now. Please try again later."
    //   };
    //   setMessages(prev => [...prev, errorMessage]);
    // } finally {
    //   setIsLoading(false);
    // }
    setIsLoading(false);
  };

  const handleAiTurnComplete = (message: string) => {
    handleApiResponse(message);
    setIsLoading(false);
  };

  const handleChatMessageSubmit = async (message: string) => {
    if (!connected || isLoading) return;

    const newUserMessage: ChatMessage = { author: MessageAuthor.USER, text: message };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    client.send({ text: message });
    // try {
    //   if (!chatRef.current) {
    currentFunctionCallId.current = null;


    setIsLoading(false);
  };

  const toggleMute = () => setIsMuted(prev => !prev);

  const handleStartOver = () => {
    setMessages([]);
    setIsRecreationReady(false);
    setDreamAnalysis(null);
    setFinalDreamImageUrl(null);
    setEvolvingImageUrl(null);
    setCurrentImageData(null);
    setIsGeneratingImage(false);
    transitionTo(AppStage.INTRO);
  };

  const renderStage = () => {
    switch (stage) {
      case AppStage.INTRO:
        return <Intro onComplete={() => {
          transitionTo(AppStage.DREAM_INPUT);
          connect();
        }} />;
      case AppStage.DREAM_INPUT:
        return <DreamInput onSubmit={handleDreamSubmit} />;
      case AppStage.ANALYSIS:
        return (
          <ChatInterface
            messages={messages}
            onSubmit={handleChatMessageSubmit}
            onAiTurnComplete={handleAiTurnComplete}
            isLoading={isLoading}
            isRecreationReady={isRecreationReady}
            isMuted={isMuted}
          />
        );
      case AppStage.DREAM_ANALYSIS:
        return dreamAnalysis ? (
          <DreamAnalysisView
            analysis={dreamAnalysis}
            onStartOver={handleStartOver}
            onViewDreamscape={() => transitionTo(AppStage.RECREATION)}
          />
        ) : (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="mb-4">
                <div className="loader-dot bg-neutral-400 inline-block mx-1"></div>
                <div className="loader-dot bg-neutral-400 inline-block mx-1 [animation-delay:-0.15s]"></div>
                <div className="loader-dot bg-neutral-400 inline-block mx-1 [animation-delay:-0.3s]"></div>
              </div>
              <p className="text-neutral-600 font-light">Analyzing your dream...</p>
            </div>
          </div>
        );
      case AppStage.RECREATION:
        return <Dreamscape onStartOver={handleStartOver} imageUrl={finalDreamImageUrl} onBack={() => transitionTo(AppStage.DREAM_ANALYSIS)} />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center font-sans text-black p-4 relative overflow-hidden bg-white" style={{ perspective: '1000px' }}>
      <DynamicBackground imageUrl={evolvingImageUrl} messages={messages} />

      <button
        onClick={toggleMute}
        className="absolute top-6 right-6 z-50 p-3 rounded-2xl bg-black/5 text-black/70 hover:bg-black/10 transition-all duration-300 backdrop-blur-xl border border-black/8"
        aria-label={isMuted ? "Unmute voice" : "Mute voice"}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        )}
      </button>

      <div ref={contentRef} className="z-10 w-full" style={{ transformStyle: 'preserve-3d' }}>
        {renderStage()}
      </div>
    </main>
  );
};

export default App;