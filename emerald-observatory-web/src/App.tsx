import React, { useState } from 'react';
import { MainLayout } from './components/Layout/MainLayout';
import { ClockGrid } from './components/clocks/ClockGrid';
import { LocationDisplay } from './components/location/LocationDisplay';
import { PlanetViewer } from './components/astronomy/PlanetViewer';
import { MoonPhaseDisplay } from './components/astronomy/MoonPhaseDisplay';
import { SunMoonTimes } from './components/astronomy/SunMoonTimes';
import { TimeControls } from './components/controls/TimeControls';
import { ThemeToggle } from './components/controls/ThemeToggle';
import { ExportPanel } from './components/controls/ExportPanel';
import { SkyMap } from './components/skymap/SkyMap';
import { useAstronomy } from './hooks/useAstronomy';
import { useTimeTravel } from './hooks/useTimeTravel';
import { useLocation } from './hooks/useLocation';
import './App.css';

function App() {
  const { currentTime, isLiveMode, setTime, resetToNow } = useTimeTravel();
  const { location, accuracy, isLoading: locationLoading, error: locationError, requestLocation } = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'skymap' | 'controls'>('overview');

  const {
    planets,
    visiblePlanets,
    moonPhase,
    sunMoonTimes,
    isLoading: astronomyLoading,
    error: astronomyError,
    refresh
  } = useAstronomy({
    updateInterval: isLiveMode ? 30000 : 0, // Update every 30s in live mode, no updates in time travel
    location,
    currentTime
  });

  const tabs = [
    { id: 'overview', label: 'Observatory', icon: '🔭' },
    { id: 'skymap', label: 'Sky Map', icon: '🌌' },
    { id: 'controls', label: 'Controls', icon: '⚙️' }
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with Theme Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Emerald Observatory
            </h1>
            <p className="text-lg text-gray-300">
              Professional astronomical calculations and real-time sky data
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-black/20 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Time Travel Status */}
        {!isLiveMode && (
          <div className="bg-orange-500/20 border border-orange-500/40 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <h3 className="font-semibold text-orange-200">Time Travel Mode Active</h3>
                  <p className="text-sm text-orange-300">
                    Viewing data for: {currentTime.toFormat('yyyy-MM-dd HH:mm:ss ZZZZ')}
                  </p>
                </div>
              </div>
              <button
                onClick={resetToNow}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors"
              >
                Return to Live Mode
              </button>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Time and Location Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <ClockGrid />
              </div>
              <div className="xl:col-span-1">
                <LocationDisplay />
              </div>
            </div>

            {/* Astronomical Data Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                  <span>🌌</span>
                  Astronomical Data
                  {astronomyLoading && (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                </h3>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Real-time calculations of planetary positions, moon phases, and solar events 
                  based on your {isLiveMode ? 'current' : 'selected'} location and time.
                </p>
                {astronomyError && (
                  <div className="mt-4 bg-red-500/20 border border-red-500/40 rounded-lg p-3 max-w-2xl mx-auto">
                    <p className="text-red-200">{astronomyError}</p>
                    <button
                      onClick={refresh}
                      className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>

              {/* Astronomy Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className="lg:col-span-2 xl:col-span-2">
                  <PlanetViewer 
                    planets={planets}
                    isLoading={astronomyLoading}
                    error={astronomyError}
                  />
                </div>
                <div className="lg:col-span-1 xl:col-span-1">
                  <MoonPhaseDisplay moonPhase={moonPhase} />
                </div>
              </div>

              <div>
                <SunMoonTimes sunMoonTimes={sunMoonTimes} />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 text-center">
                <div className="text-3xl mb-3">🪐</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {visiblePlanets.length} Visible Planets
                </h3>
                <p className="text-gray-300 text-sm">
                  Currently above your horizon
                </p>
                {visiblePlanets.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-1">
                    {visiblePlanets.slice(0, 3).map((planet) => (
                      <span key={planet.name} className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                        {planet.name}
                      </span>
                    ))}
                    {visiblePlanets.length > 3 && (
                      <span className="text-xs text-gray-400">+{visiblePlanets.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>

              <div className="glass-panel p-6 text-center">
                <div className="text-3xl mb-3">{moonPhase ? '🌙' : '🌑'}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {moonPhase?.phaseName || 'Moon Phase'}
                </h3>
                <p className="text-gray-300 text-sm">
                  {moonPhase 
                    ? `${moonPhase.illumination.toFixed(0)}% illuminated`
                    : 'Loading moon phase data...'
                  }
                </p>
              </div>

              <div className="glass-panel p-6 text-center">
                <div className="text-3xl mb-3">{isLiveMode ? '🔴' : '⏸️'}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {isLiveMode ? 'Live Updates' : 'Time Travel'}
                </h3>
                <p className="text-gray-300 text-sm">
                  {isLiveMode 
                    ? 'Real-time astronomical data'
                    : 'Exploring historical/future sky'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skymap' && location && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <span>🌌</span>
                Interactive Sky Map
              </h3>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Explore the sky with real-time 3D visualization of celestial objects. 
                Use mouse to look around and scroll to zoom.
              </p>
            </div>

            <SkyMap 
              currentTime={currentTime}
              location={location}
              className="h-screen max-h-[600px]"
            />

            <div className="glass-panel p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Sky Map Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">🪐</div>
                  <h5 className="font-medium text-white mb-1">Planetary Positions</h5>
                  <p className="text-sm text-gray-300">Real-time planet locations</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🌙</div>
                  <h5 className="font-medium text-white mb-1">Sun & Moon</h5>
                  <p className="text-sm text-gray-300">Solar and lunar tracking</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🧭</div>
                  <h5 className="font-medium text-white mb-1">Cardinal Directions</h5>
                  <p className="text-sm text-gray-300">N, E, S, W markers</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🔄</div>
                  <h5 className="font-medium text-white mb-1">Interactive View</h5>
                  <p className="text-sm text-gray-300">Mouse controls & zoom</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <span>⚙️</span>
                Controls & Export
              </h3>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Advanced controls for time travel, data export, and sharing your observations.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimeControls
                currentTime={currentTime}
                onTimeChange={setTime}
                onResetToNow={resetToNow}
                isLiveMode={isLiveMode}
              />
              
              {location && (
                <ExportPanel
                  currentTime={currentTime}
                  location={location}
                />
              )}
            </div>

            {/* Additional Features */}
            <div className="glass-panel p-6">
              <h4 className="text-xl font-semibold text-white mb-4">Advanced Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <h5 className="font-medium text-blue-300 mb-2">⏰ Time Travel</h5>
                  <p className="text-sm text-gray-300">
                    Explore astronomical events at any date and time. Perfect for planning 
                    observations or studying historical events.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-green-300 mb-2">💾 Data Export</h5>
                  <p className="text-sm text-gray-300">
                    Export observation data in JSON, CSV, or text formats. Include notes 
                    and share with other astronomers.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-purple-300 mb-2">🔗 Sharing</h5>
                  <p className="text-sm text-gray-300">
                    Generate shareable URLs that preserve exact time and location for 
                    collaborative observations.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-orange-300 mb-2">🎨 Themes</h5>
                  <p className="text-sm text-gray-300">
                    Switch between dark, light, and auto themes. Perfect for day or night 
                    observation sessions.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-yellow-300 mb-2">🌌 3D Sky Map</h5>
                  <p className="text-sm text-gray-300">
                    Interactive 3D visualization of the celestial sphere with real-time 
                    object tracking and positioning.
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-indigo-300 mb-2">📊 Live Data</h5>
                  <p className="text-sm text-gray-300">
                    Professional-grade astronomical calculations using the astronomy-engine 
                    library for maximum accuracy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Information */}
        <div className="text-center py-8 border-t border-white/10">
          <p className="text-gray-400 mb-2">
            Emerald Observatory Web - Phase 5 Complete
          </p>
          <p className="text-sm text-gray-500">
            Built with React, TypeScript, Three.js, and astronomy-engine for professional astronomical calculations
          </p>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
