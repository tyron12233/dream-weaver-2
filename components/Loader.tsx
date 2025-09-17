interface LoaderProps {
  isDark?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ isDark = false }) => {
  const dotColor = isDark ? 'bg-white/60' : 'bg-neutral-400';

  return (
    <div className="flex items-center justify-center space-x-2">
      <div className={`loader-dot ${dotColor} [animation-delay:-0.3s]`}></div>
      <div className={`loader-dot ${dotColor} [animation-delay:-0.15s]`}></div>
      <div className={`loader-dot ${dotColor}`}></div>
    </div>
  );
};

export default Loader;
