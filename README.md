# GovAI Form Filler

An agentic, hands-free PDF form filler designed for accessibility.

## Features
- **100% Hands-Free**: Navigate and fill forms using only your voice.
- **Real-Time Interaction**: The agent reads fields to you and listens for your answers.
- **Premium Design**: Accessible, high-contrast, and modern UI.
- **Privacy Focused**: All processing happens locally in your browser.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. Open the app in your browser (usually `http://localhost:5173`).
2. **Upload a PDF Form**: Drag and drop a PDF with fillable text fields.
3. **Start the Agent**:
   - Say "Start" or click the microphone icon.
   - The agent will read the first field (e.g., "What is your First Name?").
4. **Speak Your Answer**:
   - Say "John".
   - The agent will fill the field and move to the next one.
5. **Download**:
   - When finished, say "Download" to save the filled PDF.

## Tech Stack
- React + Vite
- pdf-lib (PDF manipulation)
- react-pdf (PDF rendering)
- Web Speech API (Native browser speech recognition/synthesis)
