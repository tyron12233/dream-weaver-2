import { useLiveAPIContext } from '@/contexts/LiveAPIContext';
import { useEffect, useState } from 'react';
import AIVoiceVisualization from './AIVoiceVisualization';

interface DreamInputProps {
  onSubmit: (dream: string) => void;
}

const DreamInput: React.FC<DreamInputProps> = ({ onSubmit }) => {
  const [dream, setDream] = useState('');

  const { client, connected } = useLiveAPIContext();

  useEffect(() => {
    if (!connected) return;

    client.send({ text: "[DREAM INPUT STAGE]" });
  }, [connected]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dream.trim()) {
      onSubmit(dream);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center p-4">
      <AIVoiceVisualization showWhenSilent={true} size='large' />
      <h2 data-transition-target="title" className="mt-8 text-3xl font-bold bg-gradient-to-br from-black to-neutral-700 bg-clip-text text-transparent mb-4 text-center">
        Tell me about your dream...
      </h2>
      <p data-transition-target="subtitle" className="text-neutral-500 mb-8 text-center font-light">
        Don't hold back. Describe the scenes, the feelings, the colors, the absurdities.
      </p>
      <form onSubmit={handleSubmit} className="w-full">
        <textarea
          data-transition-target="textarea"
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          placeholder="Last night, I dreamt of..."
          className="w-full h-64 p-6 bg-white/60 border border-black/8 rounded-2xl shadow-glass backdrop-blur-2xl resize-none focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/20 transition-all duration-300 text-neutral-800"
        ></textarea>
        <div data-transition-target="button-container" className="flex justify-center mt-8">
          <button
            type="submit"
            disabled={!dream.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Analyze Dream
          </button>
        </div>
      </form>
    </div>
  );
};

export default DreamInput;