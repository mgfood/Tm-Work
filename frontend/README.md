# TmWork Frontend

## Architecture
- Completely independent from backend
- Communicates ONLY via REST API
- No business logic involved
- No direct database access

## Structure
- `src/api`: API clients (axios/fetch)
- `src/components`: UI components
- `src/pages`: App pages
- `src/store`: State management
- `public`: Static assets

## Setup
1. Configure `.env` based on `.env.example`
2. Install dependencies (once framework is selected)
3. Run development server
