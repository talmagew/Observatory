# Emerald Observatory Web

A modern web-based reimplementation of the Emerald Observatory iOS app, providing astronomical calculations and visualizations.

## Features

- Multiple clock displays (UTC, Solar, Sidereal)
- Planetary positions
- Moon phase and position
- Earth view with day/night visualization
- Sunrise/sunset times
- Astronomical calculations
- Eclipse predictions

## Technology Stack

- React + TypeScript
- Three.js for 3D visualizations
- Luxon for time management
- Astronomy-engine for astronomical calculations
- Tailwind CSS for styling

## Development Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd emerald-observatory-web
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Run tests:
```bash
npm test
```

## Project Structure

```
emerald-observatory-web/
├── src/
│   ├── components/     # React components
│   │   ├── clocks/    # Clock-related components
│   │   ├── planets/   # Planet visualization components
│   │   ├── moon/      # Moon phase components
│   │   └── earth/     # Earth visualization components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # Core services (time, location, etc.)
│   └── utils/         # Utility functions
├── public/
│   └── assets/        # Static assets
└── tests/            # Test files
```

## Contributing

This is a personal project aimed at recreating the Emerald Observatory experience on the web. Contributions are welcome!

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Original Emerald Observatory iOS app
- Emerald Sequoia LLC for the original concept
