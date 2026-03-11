# Medical AI Diagnostics

A professional web application for AI-powered medical X-ray analysis with GradCAM visualizations. Built with Next.js, React, and Tailwind CSS.

## Features

- **Real-time X-ray Analysis**: Upload X-ray images for instant AI-powered classification
- **Model Attribution Visualization**: GradCAM heatmaps show which regions influenced the prediction
- **Severity Classification**: Results color-coded as Normal, Warning, or Critical
- **API Health Monitoring**: Continuous health checks with automatic retry logic
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Medical Disclaimer**: Clear disclaimer about educational and research-only purposes

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI Framework**: Tailwind CSS with custom dark theme
- **Components**: shadcn/ui with custom medical AI theme
- **Icons**: Lucide React
- **State Management**: React Hooks with custom hooks

## Architecture

### Components
- `ApiStatusBar`: Monitors backend API health with polling
- `UploadZone`: Drag-and-drop image upload interface
- `LoadingState`: Displays inference progress with visual feedback
- `ResultsPanel`: Shows predictions, confidence scores, and GradCAM visualizations
- `ClassProbabilities`: Interactive probability bar charts with severity indicators
- `GradCAMVisualization`: Side-by-side comparison of original and attribution images
- `MedicalDisclaimer`: Regulatory disclaimer message

### Hooks
- `useHealthCheck`: Polls API health every 10 seconds with 8-second timeout
- `useImageUpload`: Manages image upload state and prediction requests

### Utilities
- `prediction-utils.ts`: API communication and file validation
- Animations: Pulsing glows, scan lines, staggered progress indicators

## Setup

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Configure Environment
Copy the example environment file and update the API URL:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Start Development Server
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Backend Requirements

Your medical AI backend should expose these endpoints:

### GET /health
Health check endpoint for monitoring API availability.

**Response:**
```json
{
  "status": "ok"
}
```

### POST /predict
Image prediction endpoint for X-ray analysis.

**Request:**
```json
{
  "image": "base64_encoded_image_string"
}
```

**Response:**
```json
{
  "predictions": [
    {
      "label": "Normal",
      "probability": 0.89
    },
    {
      "label": "Abnormal",
      "probability": 0.11
    }
  ],
  "original_image": "base64_encoded_image_string",
  "gradcam_image": "base64_encoded_image_string",
  "inference_time_ms": 1234
}
```

## Image Requirements

- **Formats**: JPEG, PNG, WebP
- **Maximum Size**: 10MB
- **Recommended**: High-resolution X-ray images with clear anatomy

## Theme Customization

The application uses a dark medical AI theme with cyan accents. To customize:

1. **Colors**: Edit CSS variables in `app/globals.css`
   - Primary: `--primary: #00d4ff` (cyan)
   - Background: `--background: #050810` (dark)
   - Severity colors for Normal/Warning/Critical

2. **Animations**: Customize keyframes and animation utilities in `app/globals.css`
   - `pulse-glow`: Glowing effect for status indicators
   - `scan-lines`: Scanning line animation
   - `staggered-progress`: Progress indicator animation
   - `shimmer`: Shimmer loading effect

## API Health Monitoring

The application continuously monitors backend availability:
- **Polling Interval**: 10 seconds
- **Request Timeout**: 8 seconds
- **Failure Debounce**: 2 consecutive failures mark API as unhealthy

## Performance Optimization

- **Code Splitting**: Components are lazy-loaded automatically by Next.js
- **Image Optimization**: Base64 images streamed from backend
- **Responsive Images**: Optimized for all screen sizes
- **CSS Animations**: GPU-accelerated with will-change hints

## Deployment

### Deploy to Vercel
```bash
git push origin main
```

The application will be automatically deployed to Vercel with:
- Automatic builds on push
- Preview deployments for branches
- Production deployment on merge to main

### Environment Variables
Add to Vercel project settings:
```
NEXT_PUBLIC_API_URL=https://your-api-domain.com
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## Browser Support

- Chrome/Edge: Latest versions
- Firefox: Latest versions
- Safari: Latest versions
- Mobile: iOS 14+ and Android Chrome

## Disclaimer

This application is for **educational and research purposes only**. It is not a medical device and should not be used for diagnostic purposes. Always consult with qualified healthcare professionals for medical diagnosis and treatment.

## Development

### Code Structure
```
app/
├── layout.tsx          # Root layout with metadata
├── page.tsx            # Main application page
└── globals.css         # Theme and animations
components/
├── api-status-bar.tsx  # API health monitor
├── upload-zone.tsx     # Image upload interface
├── loading-state.tsx   # Loading indicator
├── results-panel.tsx   # Results display
├── class-probabilities.tsx  # Probability visualization
├── gradcam-visualization.tsx # Attribution visualization
└── medical-disclaimer.tsx    # Disclaimer
hooks/
├── use-health-check.ts # API health hook
└── use-image-upload.ts # Image upload hook
lib/
└── prediction-utils.ts # API utilities
```

### Building
```bash
npm run build
npm run start
```

### Linting
```bash
npm run lint
```

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check the setup requirements
2. Verify backend API is running and responding to `/health`
3. Check browser console for error messages
4. Review environment variable configuration

## Future Enhancements

- [ ] Multi-image batch processing
- [ ] Result history and comparison
- [ ] Custom model selection
- [ ] Export predictions as PDF report
- [ ] Real-time WebSocket updates for large inference tasks
- [ ] Advanced visualization tools (zoom, pan, measurements)
- [ ] User authentication and data persistence
