# Quick Start Guide - Conversa Voice Assistant

## Prerequisites

- Node.js 18+ installed
- Modern browser (Chrome, Edge, Safari 16.4+)
- ~500 MB free disk space for models

## Installation

```bash
# Navigate to the Next.js frontend
cd frontend

# Install dependencies (automatically copies WASM files)
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:3000** (or 3001 if 3000 is in use).

## First Launch

1. **Wait for models to load** (30-60 seconds first time):
   - You'll see a loading screen with progress bars
   - Models download from HuggingFace (~425 MB total)
   - Cached permanently in browser storage

2. **Grant microphone permission** when prompted

3. **Click the voice orb** to start speaking

## Usage

### Voice Assistant Modes

Choose a mode before speaking:

- **Productivity** - Task management, scheduling, focus tips
- **Learning** - Explanations, education, Q&A
- **Wellness** - Stress management, mindfulness, self-care
- **Language** - Translation, pronunciation, language learning
- **Cooking** - Recipes, techniques, culinary tips

### Speaking to the Assistant

1. Click the glowing orb (or tap on mobile)
2. Wait for "Listening..." status
3. Speak your question/request
4. Stop speaking - VAD will detect automatically
5. Wait for response (transcription → thinking → speaking)
6. Listen to AI response

### Conversation Flow

```
You speak → VAD detects → Whisper transcribes → 
→ LFM2 generates → Piper synthesizes → Audio plays
```

## Browser Console

Monitor loading progress in browser DevTools (F12):

```javascript
// Good output:
[RunAnywhere] SDK initialized
[RunAnywhere] LlamaCPP backend registered
[RunAnywhere] ONNX backend registered
[RunAnywhere] Loading lfm2-350m-q4_k_m: 23%
[RunAnywhere] Model loaded: lfm2-350m-q4_k_m
```

## Troubleshooting

### "Failed to load models" error

**Solution 1: Check WASM files**
```bash
ls -lh public/assets/*.wasm
# Should show 4 files (~8 MB)

ls -lh public/assets/sherpa/
# Should show sherpa-onnx.wasm (~12 MB)
```

If missing, run:
```bash
npm run postinstall
```

**Solution 2: Clear browser cache**
- Chrome: Settings → Privacy → Clear browsing data
- Or use Incognito mode

**Solution 3: Check console for errors**
- Open DevTools (F12) → Console tab
- Look for 404 errors on `/assets/` paths

### "Microphone permission denied"

- Check browser address bar for microphone icon
- Click → Allow microphone access
- Reload page

### Models loading very slowly

- First download is ~425 MB (can take 1-2 minutes on slow connections)
- Subsequent loads are instant (cached)
- Check Network tab in DevTools for progress

### "SharedArrayBuffer not available"

Ensure you're accessing via:
- `http://localhost:3000` (not file://)
- HTTPS in production
- Check console for COOP/COEP header warnings

### Audio not playing

- Check browser volume
- Check system audio output device
- Try clicking orb again
- Check console for TTS errors

## Advanced

### View Conversation History

Open browser DevTools → Application → Storage → Local Storage:
```javascript
// View history
localStorage.getItem('conversa-conversation-history')
```

### Clear All Data

Go to **Privacy** screen → Click "Clear Data" button

Or manually:
```javascript
// Browser console
localStorage.clear()
```

### Model Information

All models run 100% offline:

- **LLM**: Liquid AI LFM2 350M (250 MB)
- **STT**: OpenAI Whisper Tiny (105 MB)
- **TTS**: Piper VITS Lessac (65 MB)
- **VAD**: Silero VAD v5 (5 MB)

Total: ~425 MB (stored in browser OPFS)

### Performance Tips

- Close unused browser tabs
- Use Chrome/Edge for best performance
- Enable hardware acceleration in browser settings
- First response may be slower (model warmup)

## Development

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables

No environment variables needed - everything runs in browser!

### File Structure

```
frontend/
├── app/              # Next.js pages
├── components/       # UI components
├── hooks/           # React hooks
├── lib/             # AI service & SDK
├── public/assets/   # WASM files
└── scripts/         # Build scripts
```

## Support

- Check `/frontend/WASM_FIX.md` for WASM loading issues
- See `/REFACTOR_SUMMARY.md` for architecture details
- Review browser console for detailed error messages

## Notes

- Internet required ONLY for initial model download
- After that, works 100% offline
- No data sent to any server
- Models cached permanently unless you clear browser data
- Conversation history stored locally in localStorage
