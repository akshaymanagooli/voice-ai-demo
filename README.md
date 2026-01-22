# 🎙️ VoiceAction AI (React Native + Groq)

A high-performance voice assistant that converts speech into actionable tasks in under 600ms.

### ⚡ The Stack
- **Mobile:** React Native (Expo)
- **Audio Engine:** `expo-av` (M4A recording)
- **Speech-to-Text:** Groq Whisper (Large V3)
- **Intelligence:** Groq Llama 3 (8B)

### 🚀 Why Groq?
I chose Groq over OpenAI for this specific implementation to minimize latency.
- **OpenAI GPT-4o:** ~1.5s average latency.
- **Groq Llama 3:** ~0.2s average latency.
*Result: A real-time conversational UI that feels native.*

### 🛠️ Key Features
1.  **Optimistic UI:** Instant feedback states while processing audio.
2.  **Robust Error Handling:** Manages API rate limits (429) gracefully.
3.  **Strict JSON Parsing:** Prompts the LLM to return strictly formatted JSON arrays for reliable rendering.

## 📸 Demo
<div align="center">
  <img src="assets/demo.gif" width="300" />
  <p><i>Real-time Voice-to-Action with < 600ms latency</i></p>
</div>

## 🏃‍♂️ How to Run
1.  Clone the repo.
2.  `yarn install`
3.  Create `.env` with `EXPO_PUBLIC_GROQ_KEY=your_key`
4.  `yarn android` (Requires Physical Device for Microphone)