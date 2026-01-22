import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVoiceRecorder } from './hook/useVoiceRecorder';
import * as FileSystem from 'expo-file-system';
import axios from 'axios';

// ⚠️ REPLACE WITH YOUR KEY if not using .env
const GROQ_KEY = process.env.EXPO_PUBLIC_GROQ_KEY || 'YOUR_GROQ_KEY'; 

export default function App() {
  const { startRecording, stopRecording, isRecording } = useVoiceRecorder();
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [actionItems, setActionItems] = useState([]);

  const handlePressIn = async () => {
    setTranscript('');
    setActionItems([]);
    await startRecording();
  };

  const handlePressOut = async () => {
    const uri = await stopRecording();
    if (uri) {
      processAudio(uri);
    }
  };

const processAudio = async (uri) => {
  setLoading(true);
  try {
    // 1. Prepare Form Data
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      type: 'audio/m4a', // OR 'audio/wav' depending on Android/iOS
      name: 'audio.m4a',
    });
    formData.append('model', 'whisper-large-v3'); // Groq's Whisper Model

    // 2. Send to Groq (Speech-to-Text)
    console.log("Uploading to Groq Whisper...");
    const whisperResponse = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions', // Groq URL
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${GROQ_KEY}`,
        },
      }
    );
    console.log("Whisper response:", JSON.stringify(whisperResponse));

    const text = whisperResponse.data.text;
    setTranscript(text);

    // 3. Send to Groq Llama 3 (Text-to-Action)
    console.log("Extracting actions with Llama 3...");
    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions', // Groq URL
      {
        model: "llama-3.1-8b-instant", // Fast & Free model
        messages: [
          { role: "system", content: "You are a helpful assistant. Extract actionable tasks from the user's text. Return ONLY a JSON array of strings. Example: [\"Buy milk\", \"Call John\"]. Do not output markdown or explanations." },
          { role: "user", content: text }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_KEY}`,
        },
      }
    );

    console.log("Parsing Llama response...", JSON.stringify(groqResponse));

    // Parse the JSON response
    const rawContent = groqResponse.data.choices[0].message.content;
    
    // Clean up potential markdown code blocks if Llama adds them
    const cleanJson = rawContent.replace(/```json|```/g, '').trim();
    
    try {
      const tasks = JSON.parse(cleanJson);
      setActionItems(tasks);
    } catch (e) {
      console.log("JSON Parse Error:", e);
      setActionItems([rawContent]); // Fallback
    }

  } catch (error) {
    // Check specifically for Rate Limit error
  if (error.response && error.response.status === 429) {
    Alert.alert(
      "Whoa! Slow down 🏎️", 
      "We hit the free tier limit. Please wait 30 seconds and try again."
    );
  } 
  // Check for Server Overload (Common with Free tiers)
  else if (error.response && error.response.status === 503) {
    Alert.alert(
      "Traffic Jam 🚦", 
      "Groq is experiencing high traffic. Retrying might work."
    );
  }
  else {
    console.error("API Error:", error);
    Alert.alert("Error", "Something went wrong.");
  }
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>🎙️ Voice Action AI</Text>
        
        {/* Output Area */}
        <View style={styles.card}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Processing your thoughts...</Text>
            </View>
          ) : (
            <>
              {transcript ? (
                <View>
                  <Text style={styles.label}>You said:</Text>
                  <Text style={styles.transcript}>"{transcript}"</Text>
                  
                  <View style={styles.divider} />
                  
                  <Text style={styles.label}>Action Items:</Text>
                  {actionItems.length > 0 ? (
                    actionItems.map((item, index) => (
                      <View key={index} style={styles.taskRow}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.taskText}>{item}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noTasks}>No actionable tasks found.</Text>
                  )}
                </View>
              ) : (
                <Text style={styles.placeholder}>Hold the button and speak...</Text>
              )}
            </>
          )}
        </View>
      </View>

      {/* Mic Button */}
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.micButton, isRecording && styles.micButtonActive]}
      >
        <Text style={styles.micIcon}>{isRecording ? 'Listening...' : '🎤'}</Text>
      </TouchableOpacity>
      
      {isRecording && <Text style={styles.hint}>Release to process</Text>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  content: { flex: 1, padding: 20, justifyContent: "center" },
  header: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 30,
    color: "#1C1C1E",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 25,
    minHeight: 200,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  placeholder: {
    textAlign: "center",
    color: "#8E8E93",
    fontSize: 16,
    marginTop: 60,
  },
  loadingBox: { alignItems: "center", marginTop: 50 },
  loadingText: { marginTop: 15, color: "#8E8E93", fontSize: 16 },
  label: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#8E8E93",
    fontWeight: "600",
    marginBottom: 8,
  },
  transcript: {
    fontSize: 18,
    color: "#1C1C1E",
    marginBottom: 20,
    fontStyle: "italic",
  },
  divider: { height: 1, backgroundColor: "#E5E5EA", marginBottom: 20 },
  taskRow: { flexDirection: "row", marginBottom: 12 },
  bullet: { fontSize: 18, color: "#007AFF", marginRight: 10 },
  taskText: { fontSize: 18, color: "#1C1C1E", fontWeight: "500" },
  noTasks: { fontSize: 16, color: "#8E8E93", fontStyle: "italic" },
  micButton: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  micButtonActive: { backgroundColor: "#FF3B30", transform: [{ scale: 1.1 }] },
  micIcon: { fontSize: 32, color: "#FFF" },
  hint: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    color: "#8E8E93",
  },
});