import { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import AIVoiceVisualization from "./AIVoiceVisualization";
import GeminiButton from "./GeminiButton";

interface IntroProps {
  onComplete: () => void;
}

function Intro({ onComplete }: IntroProps) {
  const orbRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (orbRef.current) {
      gsap.to(orbRef.current, {
        duration: 8,
        scale: 1.05,
        rotationY: 360,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(orbRef.current, {
        duration: 6,
        boxShadow:
          "0 0 60px 15px rgba(0, 0, 0, 0.1), 0 0 120px 30px rgba(0, 0, 0, 0.05)",
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center text-center h-screen max-h-[600px]"
    >
      <div className="relative">
        <div
          data-transition-target="orb"
          ref={orbRef}
          className="orb w-32 h-32 md:w-48 md:h-48 rounded-full mb-12 animate-float"
        ></div>
        {/* AI Voice Visualization overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <AIVoiceVisualization size="large" showWhenSilent={true} />
        </div>
      </div>
      <h1
        data-transition-target="title"
        className="text-4xl md:text-6xl font-bold tracking-tighter bg-gradient-to-br from-black to-neutral-700 bg-clip-text text-transparent mb-4"
      >
        Dream Weaver
      </h1>
      <p
        data-transition-target="subtitle"
        className="text-lg md:text-xl text-neutral-600 max-w-md mb-8 font-light"
      >
        Unlock the secrets of your subconscious. Let's explore the world behind
        your eyes.
      </p>
      <GeminiButton onClick={onComplete}>Begin Weaving</GeminiButton>
    </div>
  );
}

export default Intro;
