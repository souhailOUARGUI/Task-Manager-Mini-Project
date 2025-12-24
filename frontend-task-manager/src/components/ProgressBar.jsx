const ProgressBar = ({ progress = 0, completed = 0, total = 0 }) => {
  // Added this safeProgrees to verify that progress is always between 0 and 100
  const safeProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
        <span>{completed} / {total} tasks</span>
        <span>{Math.round(safeProgress)}%</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            safeProgress === 100 ? 'bg-green-500' : 'bg-blue-600'
          }`}
          style={{ width: `${safeProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;