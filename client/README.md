# PUMP Client

The frontend application for PUMP - Fitness Tracker.

## Technology Stack

- **React 19** - UI framework
- **Vite** - Build tool
- **TailwindCSS 4** - Styling
- **React Router** - Navigation
- **TypeScript** - Type safety

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file with:

```env
VITE_API_URL=http://localhost:5000
```

For production:

```env
VITE_API_URL=https://your-backend-url.com
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components (routes)
├── services/       # API client and services
├── assets/         # Static assets
└── App.tsx         # Main app component with routing
```
