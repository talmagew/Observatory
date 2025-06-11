import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';

interface TimeControlsProps {
  currentTime: DateTime;
  onTimeChange: (newTime: DateTime) => void;
  onResetToNow: () => void;
  isLiveMode: boolean;
  className?: string;
}

export function TimeControls({ 
  currentTime, 
  onTimeChange, 
  onResetToNow, 
  isLiveMode,
  className = '' 
}: TimeControlsProps) {
  const [selectedDate, setSelectedDate] = useState(currentTime.toISODate());
  const [selectedTime, setSelectedTime] = useState(currentTime.toFormat('HH:mm'));
  const [isExpanded, setIsExpanded] = useState(false);

  // Update local state when external time changes (in live mode)
  useEffect(() => {
    if (isLiveMode) {
      setSelectedDate(currentTime.toISODate());
      setSelectedTime(currentTime.toFormat('HH:mm'));
    }
  }, [currentTime, isLiveMode]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    if (!isLiveMode) {
      const newDateTime = DateTime.fromISO(`${newDate}T${selectedTime}`);
      if (newDateTime.isValid) {
        onTimeChange(newDateTime);
      }
    }
  };

  const handleTimeChange = (newTime: string) => {
    setSelectedTime(newTime);
    if (!isLiveMode) {
      const newDateTime = DateTime.fromISO(`${selectedDate}T${newTime}`);
      if (newDateTime.isValid) {
        onTimeChange(newDateTime);
      }
    }
  };

  const handleQuickJump = (offset: { days?: number; hours?: number; minutes?: number }) => {
    const newTime = currentTime.plus(offset);
    onTimeChange(newTime);
    setSelectedDate(newTime.toISODate());
    setSelectedTime(newTime.toFormat('HH:mm'));
  };

  const formatCurrentTime = () => {
    return currentTime.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ');
  };

  const getTimeStatus = () => {
    const now = DateTime.now();
    const diffMinutes = currentTime.diff(now, 'minutes').minutes;
    
    if (Math.abs(diffMinutes) < 1) return { status: 'live', text: 'Live' };
    if (diffMinutes > 0) return { status: 'future', text: 'Future' };
    return { status: 'past', text: 'Past' };
  };

  const timeStatus = getTimeStatus();

  return (
    <div className={`glass-panel p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <span>⏰</span>
          Time Controls
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Current Time Display */}
      <div className="bg-black/20 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Current Time</p>
            <p className="text-white font-mono text-lg">{formatCurrentTime()}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              timeStatus.status === 'live' ? 'bg-green-400' : 
              timeStatus.status === 'future' ? 'bg-blue-400' : 'bg-orange-400'
            }`} />
            <span className={`text-sm font-medium ${
              timeStatus.status === 'live' ? 'text-green-300' : 
              timeStatus.status === 'future' ? 'text-blue-300' : 'text-orange-300'
            }`}>
              {timeStatus.text}
            </span>
          </div>
        </div>
      </div>

      {/* Live Mode Toggle */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onResetToNow}
          disabled={isLiveMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isLiveMode 
              ? 'bg-green-600 text-white cursor-default'
              : 'bg-gray-600 hover:bg-green-600 text-white'
          }`}
        >
          <span>🔴</span>
          {isLiveMode ? 'Live Mode' : 'Go Live'}
        </button>
        
        {!isLiveMode && (
          <div className="text-sm text-orange-300">
            Time Travel Mode Active
          </div>
        )}
      </div>

      {/* Expanded Controls */}
      {isExpanded && (
        <div className="space-y-6">
          {/* Manual Date/Time Input */}
          <div>
            <h4 className="text-lg font-medium text-blue-300 mb-3">Set Specific Date & Time</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate || ''}
                  onChange={(e) => handleDateChange(e.target.value)}
                  disabled={isLiveMode}
                  className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Time</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  disabled={isLiveMode}
                  className="w-full bg-black/30 border border-white/20 rounded px-3 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Jump Controls */}
          <div>
            <h4 className="text-lg font-medium text-purple-300 mb-3">Quick Time Jumps</h4>
            
            {/* Time Jumps */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Time</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleQuickJump({ minutes: -15 })}
                  disabled={isLiveMode}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  -15min
                </button>
                <button
                  onClick={() => handleQuickJump({ hours: -1 })}
                  disabled={isLiveMode}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  -1hr
                </button>
                <button
                  onClick={() => handleQuickJump({ hours: 1 })}
                  disabled={isLiveMode}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  +1hr
                </button>
                <button
                  onClick={() => handleQuickJump({ minutes: 15 })}
                  disabled={isLiveMode}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  +15min
                </button>
              </div>
            </div>

            {/* Date Jumps */}
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Date</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleQuickJump({ days: -7 })}
                  disabled={isLiveMode}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  -1 week
                </button>
                <button
                  onClick={() => handleQuickJump({ days: -1 })}
                  disabled={isLiveMode}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  -1 day
                </button>
                <button
                  onClick={() => handleQuickJump({ days: 1 })}
                  disabled={isLiveMode}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  +1 day
                </button>
                <button
                  onClick={() => handleQuickJump({ days: 7 })}
                  disabled={isLiveMode}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  +1 week
                </button>
              </div>
            </div>

            {/* Astronomical Events */}
            <div>
              <p className="text-sm text-gray-400 mb-2">Jump to Events</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    // Jump to next solar noon
                    const tomorrow = currentTime.plus({ days: 1 }).startOf('day').plus({ hours: 12 });
                    onTimeChange(tomorrow);
                    setSelectedDate(tomorrow.toISODate());
                    setSelectedTime(tomorrow.toFormat('HH:mm'));
                  }}
                  disabled={isLiveMode}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  ☀️ Next Noon
                </button>
                <button
                  onClick={() => {
                    // Jump to next midnight
                    const tonight = currentTime.plus({ days: 1 }).startOf('day');
                    onTimeChange(tonight);
                    setSelectedDate(tonight.toISODate());
                    setSelectedTime(tonight.toFormat('HH:mm'));
                  }}
                  disabled={isLiveMode}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  🌙 Next Midnight
                </button>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <h5 className="font-medium text-blue-300 mb-2">Time Travel Mode</h5>
            <p className="text-sm text-gray-300">
              Use time travel mode to explore astronomical events at any date and time. 
              All planetary positions, moon phases, and celestial events will be calculated 
              for your selected time. Return to live mode to resume real-time tracking.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 