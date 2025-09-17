import Loader from './Loader';

interface DreamscapeProps {
  onStartOver: () => void;
  imageUrl?: string | null;
  onBack?: () => void;
}

const Dreamscape: React.FC<DreamscapeProps> = ({ onStartOver, imageUrl, onBack }) => {
  return (
    <div className="w-full max-w-4xl h-[70vh] mx-auto flex flex-col items-center justify-center text-center p-4">
      <div data-transition-target="content" className="flex-1 w-full bg-black/5 rounded-3xl shadow-float backdrop-blur-2xl border border-black/10 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black via-transparent to-transparent"></div>
        <h2 className="text-3xl font-bold text-black mb-4 bg-gradient-to-br from-black to-neutral-600 bg-clip-text text-transparent">
          Weaving the fabric of your dream...
        </h2>
        <p className="text-neutral-500 mb-8 font-light">
          This is where your dream will come to life. (3D visualization coming soon)
        </p>
        <div className="space-y-4">
          <Loader />
          <p className="text-black/70 animate-pulse font-medium">
            Initializing dream matrix...
          </p>
        </div>
      </div>
      <button
        data-transition-target="button"
        onClick={onStartOver}
        className="mt-8 btn-secondary"
      >
        Weave Another Dream
      </button>

      {onBack && (
        <button
          data-transition-target="back-button"
          onClick={onBack}
          className="mt-4 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
        >
          &larr; Back
        </button>
      )}
    </div>
  );
};

export default Dreamscape;