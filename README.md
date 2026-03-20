# Football Pulse

Football Pulse is a React football analytics dashboard that lets users explore leagues, teams, players, player comparisons, and performance trends from live football data.

## Overview

The project was built as a component-based React application for a live class demonstration milestone. It focuses on:

- multi-page navigation with React Router
- asynchronous API integration
- football league, team, and player exploration
- data-driven UI sections on the dashboard
- comparison and timeline visualisation pages

## Main Features

- Dashboard landing page with featured matches, spotlight player content, and live or upcoming match data
- Players page with league selection, team selection, player search, and detailed player profiles
- Teams page with searchable club cards and team detail modal
- Player Comparison page for side-by-side visual comparison across key metrics
- Timeline page for tracking selected performance metrics across players and averages
- Shared topbar search across players, teams, and leagues
- Auto-refresh support through a shared application refresh event

## Routes

- `/` Dashboard
- `/players` Players
- `/teams` Teams
- `/comparison` Player Comparison
- `/timeline` Performance Timeline

## Tech Stack

- React
- React Router
- Chart.js
- react-chartjs-2
- Bootstrap and custom CSS
- Native fetch with async or await for API requests

## API Integration

Football Pulse supports two football data providers:

1. API-Football via RapidAPI as the primary provider
2. TheSportsDB as the fallback provider when RapidAPI credentials are not available

The API service layer is implemented in `src/api/apiFootball.js` and handles:

- league loading
- team loading
- player loading
- player detail lookups
- team search and player search
- live fixtures and upcoming fixtures
- response normalization across providers
- in-memory caching for faster repeated requests

## Environment Setup

Create a `.env` file in the project root with the following values:

```bash
REACT_APP_RAPIDAPI_KEY=your_rapidapi_key
REACT_APP_RAPIDAPI_HOST=api-football-v1.p.rapidapi.com
REACT_APP_RAPIDAPI_BASE_URL=https://api-football-v1.p.rapidapi.com/v3
```

If `REACT_APP_RAPIDAPI_KEY` is missing, the app automatically falls back to TheSportsDB.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Open `http://localhost:3000` in the browser.

## Available Scripts

Start the development server:

```bash
npm start
```

Run tests:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

Stop a running development server started with the provided cleanup script:

```bash
npm run stop:dev
```

Restart the app on port 3000 after stopping any existing dev server:

```bash
npm run start:clean
```

## Demonstration Talking Points

For the live milestone demo, you should be ready to explain:

- how routing is configured and why each page exists
- which API provider is being used and why there is a fallback
- how asynchronous data is fetched and stored in React state
- how the dashboard uses real data to build custom UI sections
- how player comparison and timeline views extend the core application
- what changed across your recent Git commits and why those changes were necessary

## Verification

The project has been verified with:

```bash
npm run build
CI=true npm test -- --watchAll=false
```

## Repository Notes

- The app branding is Football Pulse
- The package name is `football-pulse`
- The GitHub repository should be public before assessment
- Lecturer collaborator access should be confirmed manually before the live session
