import React from 'react';
import { MoonPhase } from '../../services/AstronomicalService';
import { useMoonPhase } from '../../hooks/useAstronomy';

interface MoonPhaseDisplayProps {
  moonPhase?: MoonPhase | null;
  className?: string;
}

export function MoonPhaseDisplay({ moonPhase: propMoonPhase, className = '' }: MoonPhaseDisplayProps) {
  const { moonPhase: hookMoonPhase, moonEmoji, isLoading, error } = useMoonPhase();
  
  // Use prop if provided, otherwise use hook data
  const moonPhase = propMoonPhase || hookMoonPhase;

  const formatDate = (date: any): string => {
    if (!date || !date.toFormat) return 'Unknown';
    return date.toFormat('MMM dd, yyyy HH:mm');
  };

  const renderMoonVisual = () => {
    if (!moonPhase) return null;

    const phase = moonPhase.phase;
    const illumination = moonPhase.illumination;
    
    // Calculate the moon appearance
    const moonSize = 80;
    const cx = moonSize / 2;
    const cy = moonSize / 2;
    const r = moonSize / 2 - 2;
    
    // Determine the illuminated portion
    let illuminatedPath = '';
    
    if (phase < 0.5) {
      // Waxing phases
      const offset = r * (1 - 2 * phase);
      illuminatedPath = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${Math.abs(offset)} ${r} 0 1 ${offset > 0 ? 0 : 1} ${cx} ${cy - r}`;
    } else {
      // Waning phases
      const offset = r * (2 * phase - 1);
      illuminatedPath = `M ${cx} ${cy - r} A ${Math.abs(offset)} ${r} 0 1 ${offset > 0 ? 1 : 0} ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
    }

    return (
      <div className="flex justify-center mb-4">
        <svg width={moonSize} height={moonSize} className="drop-shadow-lg">
          {/* Moon shadow */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="#1a1a1a"
            stroke="#4a5568"
            strokeWidth="1"
          />
          
          {/* Illuminated portion */}
          <path
            d={illuminatedPath}
            fill="#f7fafc"
            stroke="#e2e8f0"
            strokeWidth="0.5"
          />
        </svg>
      </div>
    );
  };

  if (error) {
    return (
      <div className={`glass-panel p-6 ${className}`}>
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span>🌙</span>
          Moon Phase
        </h3>
        <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-panel p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <span>🌙</span>
          Moon Phase
        </h3>
        {isLoading && (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
      </div>

      {!moonPhase ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Loading moon phase data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Moon Visual and Current Phase */}
          <div className="text-center">
            {renderMoonVisual()}
            
            <div className="space-y-2">
              <div className="text-6xl">{moonEmoji}</div>
              <h4 className="text-2xl font-bold text-white">{moonPhase.phaseName}</h4>
              <p className="text-lg text-gray-300">
                {moonPhase.illumination.toFixed(1)}% illuminated
              </p>
            </div>
          </div>

          {/* Phase Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-lg p-4">
              <h5 className="font-medium text-blue-300 mb-2">Current Phase</h5>
              <div className="space-y-1 text-sm">
                <p className="text-white">
                  <span className="text-gray-400">Phase:</span> {moonPhase.phaseName}
                </p>
                <p className="text-white">
                  <span className="text-gray-400">Age:</span> {moonPhase.age.toFixed(1)} days
                </p>
                <p className="text-white">
                  <span className="text-gray-400">Illumination:</span> {moonPhase.illumination.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="bg-black/20 rounded-lg p-4">
              <h5 className="font-medium text-purple-300 mb-2">Phase Progress</h5>
              <div className="space-y-2">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(moonPhase.phase || 0) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {((moonPhase.phase || 0) * 100).toFixed(1)}% through lunar cycle
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-black/20 rounded-lg p-4">
            <h5 className="font-medium text-yellow-300 mb-3">Upcoming Events</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-xl">🌑</span>
                <div>
                  <p className="text-white font-medium">Next New Moon</p>
                  <p className="text-gray-400">{formatDate(moonPhase.nextNewMoon)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">🌕</span>
                <div>
                  <p className="text-white font-medium">Next Full Moon</p>
                  <p className="text-gray-400">{formatDate(moonPhase.nextFullMoon)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Moon Phase Information */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h5 className="font-medium text-blue-300 mb-2">About Moon Phases</h5>
            <p className="text-sm text-gray-300">
              The Moon's phases are caused by its orbital position relative to Earth and the Sun. 
              A complete lunar cycle takes approximately 29.5 days, during which the Moon appears 
              to change from new moon to full moon and back again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 