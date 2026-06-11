import React from 'react';

const ConfusionMatrix: React.FC = () => {
  const matrix = [
    [85, 15],
    [20, 80]
  ];
  const labels = ['True (1)', 'False (0)'];

  const getColor = (val: number, isDiagonal: boolean) => {
    if (isDiagonal) {
      if (val > 80) return 'bg-emerald-500 text-white';
      return 'bg-emerald-300 text-emerald-900';
    } else {
      if (val > 15) return 'bg-red-400 text-white';
      return 'bg-red-200 text-red-900';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex">
        <div className="flex flex-col justify-center mr-4 w-12 text-xs font-semibold text-slate-500 rotate-180" style={{ writingMode: 'vertical-rl' }}>
          Actual Class
        </div>
        <div>
          <div className="flex mb-2 text-xs font-semibold text-slate-500 text-center">
             <div className="w-16"></div>
             {labels.map(l => <div key={l} className="w-20">{l}</div>)}
          </div>
          {matrix.map((row, i) => (
            <div key={i} className="flex mb-2">
              <div className="w-16 flex items-center justify-end pr-3 text-xs font-semibold text-slate-500">
                {labels[i]}
              </div>
              {row.map((val, j) => (
                <div
                  key={`${i}-${j}`}
                  className={`w-20 h-20 flex items-center justify-center m-0.5 rounded-md font-mono text-lg transition-all hover:scale-105 shadow-sm ${getColor(val, i===j)}`}
                >
                  {val}%
                </div>
              ))}
            </div>
          ))}
          <div className="text-center mt-2 text-xs font-semibold text-slate-500 pl-16">
            Predicted Class
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfusionMatrix;
