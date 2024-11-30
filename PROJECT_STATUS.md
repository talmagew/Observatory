# Project Status - Emerald Observatory Web

## Project Overview
We're creating a web-based version of the Emerald Observatory iOS app, which is an astronomical visualization tool. We've just started Phase 2 of the development, implementing core services.

## Current State

### 1. Project Structure
- React + TypeScript + Vite setup
- Jest testing framework configured
- Core dependencies installed (Three.js, Luxon, astronomy-engine)

Project Directory Structure:
```
emerald-observatory-web/
├── src/
│   ├── components/     # React components (to be implemented)
│   │   ├── clocks/    # Clock-related components
│   │   ├── planets/   # Planet visualization components
│   │   ├── moon/      # Moon phase components
│   │   └── earth/     # Earth visualization components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # Core services
│   └── utils/         # Utility functions
├── public/
│   └── assets/        # Static assets
└── tests/            # Test files
```

### 2. Implemented Features
- TimeService with:
  - UTC time management
  - Solar time calculations
  - Location awareness
  - Subscription system for updates
- React hook (useTime) for component integration
- Test suite (currently having setup issues)

### 3. Key Files
- `src/services/TimeService.ts`: Core time management service
- `src/hooks/useTime.ts`: React hook for time service
- `src/services/__tests__/TimeService.test.ts`: Test suite
- `jest.config.js` and `setupTests.ts`: Test configuration

### 4. Testing Setup
Current Jest Configuration:
```javascript
{
  "preset": "ts-jest",
  "testEnvironment": "jsdom",
  "setupFilesAfterEnv": ["<rootDir>/src/setupTests.ts"],
  "moduleNameMapper": {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png)$": "<rootDir>/src/__mocks__/fileMock.ts"
  },
  "transform": {
    "^.+\\.tsx?$": "ts-jest"
  }
}
```

## Next Steps
1. Get the test suite running (this was our immediate task when switching to Linux)
2. Implement Sidereal time calculations
3. Move on to Location Service implementation

## Dependencies
Key packages we're using:
- luxon: Time management
  - Used for DateTime operations and timezone handling
  - Current implementation uses it for basic time operations
- astronomy-engine: Astronomical calculations
  - Currently using SunPosition and Equator functions
  - Will need RotationMatrix and other functions for sidereal time
- three.js: 3D visualizations (will be used later)
- jest/ts-jest: Testing

## Resume Instructions
When resuming on Linux:
1. Ensure all dependencies are installed (`npm install`)
2. Run the test suite (`npm test`)
3. Continue with Sidereal time implementation

### Known Issues to Address
1. Test environment setup:
   - Jest configuration might need adjustment for ESM
   - Mock files need to be verified
   - Time-based tests might need timezone considerations

2. Package.json type field:
   - Currently set to "type": "module"
   - Might need adjustment for Jest compatibility

## Progress Tracking
The roadmap (roadmap.md) tracks our overall progress, with Phase 2 (Core Services) currently in progress.

## Development Environment
- Node.js environment
- TypeScript for type safety
- Vite for development server and building
- Jest for testing
- React for UI components
- Three.js for future 3D visualizations

## Current Challenges
- Test suite setup needs to be verified on Linux environment
- Sidereal time calculations need to be implemented
- Location service needs to be developed next

## Next Feature: Sidereal Time
Sidereal time is the next feature to implement in the TimeService. This will require:
1. Using astronomy-engine for calculations:
   ```typescript
   // Planned implementation approach:
   import { RotationMatrix, Astronomy } from 'astronomy-engine';
   
   getSiderealTime(): DateTime {
     const jd = this.dateTimeToJulianDate(this.getCurrentTime());
     const gst = Astronomy.SiderealTime(jd);
     const lst = gst + this.state.longitude/15;
     // Convert to DateTime and return
   }
   ```
2. Adding new tests for sidereal time
3. Updating the useTime hook to expose sidereal time
4. Ensuring accurate calculations based on location

## Astronomical Calculations Reference
Key concepts implemented/needed:
1. Julian Date conversion (implemented)
2. Equation of Time (implemented in solar time)
3. Sidereal Time (to be implemented):
   - GST (Greenwich Sidereal Time)
   - LST (Local Sidereal Time)
   - Conversion between time systems

## UI Implementation Plans
Future components will include:
1. Clock faces for:
   - UTC time
   - Solar time
   - Sidereal time
2. Location input/display
3. Time system toggles
4. Visual indicators for:
   - Day/night
   - Twilight periods
   - Astronomical events