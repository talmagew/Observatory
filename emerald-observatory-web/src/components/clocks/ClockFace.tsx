import React from 'react';
import { DateTime } from 'luxon';

interface ClockFaceProps {
  title: string;
  time: DateTime;
  description?: string;
  className?: string;
}

export function ClockFace({ title, time, description, className = '' }: ClockFaceProps) {
  const formatTime = (dt: DateTime) => {
    return dt.toFormat('HH:mm:ss');
  };

  const formatDate = (dt: DateTime) => {
    return dt.toFormat('yyyy-MM-dd');
  };

  const getTimeZone = (dt: DateTime) => {
    return dt.offsetNameShort || dt.zoneName;
  };

  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 ${className}`}>
      {/* Clock Title */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-white mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-gray-300">{description}</p>
        )}
      </div>

      {/* Digital Display */}
      <div className="text-center">
        <div className="font-mono text-4xl md:text-5xl font-bold text-white mb-2">
          {formatTime(time)}
        </div>
        
        <div className="text-lg text-gray-200 mb-1">
          {formatDate(time)}
        </div>
        
        <div className="text-sm text-gray-400">
          {getTimeZone(time)}
        </div>
      </div>

      {/* Analog Clock Placeholder */}
      <div className="mt-6 flex justify-center">
        <div className="w-32 h-32 rounded-full border-2 border-white/30 relative">
          {/* Clock face */}
          <div className="absolute inset-2 rounded-full border border-white/20">
            {/* Hour markers */}
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="absolute w-0.5 h-4 bg-white/40"
                style={{
                  top: '2px',
                  left: '50%',
                  transform: `translateX(-50%) rotate(${i * 30}deg)`,
                  transformOrigin: '50% 62px',
                }}
              />
            ))}
            
            {/* Clock hands */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Hour hand */}
              <div
                className="absolute w-1 bg-white rounded-full"
                style={{
                  height: '30px',
                  top: '34px',
                  transform: `rotate(${(time.hour % 12) * 30 + time.minute * 0.5}deg)`,
                  transformOrigin: '50% 90%',
                }}
              />
              
              {/* Minute hand */}
              <div
                className="absolute w-0.5 bg-white rounded-full"
                style={{
                  height: '40px',
                  top: '24px',
                  transform: `rotate(${time.minute * 6}deg)`,
                  transformOrigin: '50% 100%',
                }}
              />
              
              {/* Second hand */}
              <div
                className="absolute w-0.5 bg-red-400 rounded-full"
                style={{
                  height: '45px',
                  top: '19px',
                  transform: `rotate(${time.second * 6}deg)`,
                  transformOrigin: '50% 100%',
                }}
              />
              
              {/* Center dot */}
              <div className="absolute w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 