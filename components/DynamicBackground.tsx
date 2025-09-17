import { useState, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import ProceduralBackground from './ProceduralBackground';
import type { ChatMessage } from '../types';

interface DynamicBackgroundProps {
  imageUrl: string | null;
  messages?: ChatMessage[];
}

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ imageUrl, messages = [] }) => {
  const imageRefs = [useRef<HTMLImageElement>(null), useRef<HTMLImageElement>(null)];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showProcedural, setShowProcedural] = useState(true);
  const isFirstLoad = useRef(true);

  useLayoutEffect(() => {
    if (!imageUrl) {
      setShowProcedural(true);
      return;
    }

    const inactiveImageIndex = 1 - activeImageIndex;
    const activeImage = imageRefs[activeImageIndex].current;
    const inactiveImage = imageRefs[inactiveImageIndex].current;

    if (!activeImage || !inactiveImage) return;

    inactiveImage.src = imageUrl;
    inactiveImage.onload = () => {
      // Fade out procedural background when image loads
      setShowProcedural(false);

      if (isFirstLoad.current) {
        gsap.to(inactiveImage, { opacity: 1, duration: 3, ease: 'power2.inOut' });
        isFirstLoad.current = false;
      } else {
        gsap.to(activeImage, { opacity: 0, duration: 2.5, ease: 'power2.inOut' });
        gsap.to(inactiveImage, { opacity: 1, duration: 3, ease: 'power2.inOut' });
      }
      setActiveImageIndex(inactiveImageIndex);
    };
  }, [imageUrl]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-white">
      {/* Procedural background - shows when no image or as fallback */}
      <ProceduralBackground
        messages={messages}
        isActive={showProcedural || !imageUrl}
      />

      {/* Generated images */}
      <img
        ref={imageRefs[0]}
        alt="Evolving dreamscape background"
        className="absolute inset-0 w-full h-full object-cover opacity-0"
      />
      <img
        ref={imageRefs[1]}
        alt="Evolving dreamscape background"
        className="absolute inset-0 w-full h-full object-cover opacity-0"
      />
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
    </div>
  );
};

export default DynamicBackground;