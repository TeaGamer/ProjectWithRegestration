"use client";

import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
}

interface UseVoiceChatOptions {
  onTranscript: (transcript: string) => void;
}

export function useVoiceChat({ onTranscript }: UseVoiceChatOptions) {
  const [isListening, setIsListening] = useState(false);
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [voiceHelpMessage, setVoiceHelpMessage] = useState("");
  const [isVoiceHelpOpen, setIsVoiceHelpOpen] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState("uk-UA");
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const showVoiceHelp = (message: string) => {
    setVoiceHelpMessage(message);
    setIsVoiceHelpOpen(true);
  };

  const startRecording = async () => {
    setVoiceHelpMessage("");

    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognitionAPI =
      speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      showVoiceHelp(
        "This browser does not support speech recognition. Try the latest Chrome or Edge, or type your message instead.",
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      showVoiceHelp(
        "Microphone access is unavailable in this browser or page connection. Use a secure connection (HTTPS or localhost), or type your message instead.",
      );
      return;
    }

    try {
      const microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStream.getTracks().forEach((track) => track.stop());

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = voiceLanguage;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcriptParts: string[] = [];
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          if (event.results[index].isFinal) {
            transcriptParts.push(event.results[index][0].transcript);
          }
        }

        const transcript = transcriptParts.join(" ").trim();
        if (transcript) {
          onTranscriptRef.current(transcript);
        }
      };
      recognition.onerror = (event) => {
        setIsListening(false);
        recognitionRef.current = null;
        if (event.error === "aborted") return;

        const messages: Record<string, string> = {
          "not-allowed":
            "Microphone permission was denied. Allow microphone access in your browser's site settings, then try again.",
          "service-not-allowed":
            "The browser's speech recognition service is unavailable or blocked. Try another supported browser or type your message.",
          "audio-capture":
            "No working microphone was found. Connect or enable a microphone, then try again.",
          network:
            "The browser's speech recognition service could not be reached. Check your connection or type your message.",
          "no-speech":
            "No speech was detected. Check your microphone and try speaking again.",
          "language-not-supported":
            "Speech recognition does not support the selected language in this browser. Choose another language or type your message.",
        };
        showVoiceHelp(
          messages[event.error] ??
            "Voice recognition failed. Check your microphone permissions or type your message.",
        );
      };
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      setVoiceModeEnabled(true);
      recognition.start();
      setIsListening(true);
    } catch (error) {
      const microphoneError = error instanceof DOMException ? error.name : "";
      const messages: Record<string, string> = {
        NotAllowedError:
          "Microphone permission was denied. Allow microphone access in your browser's site settings, then try again.",
        NotFoundError: "No microphone was found. Connect or enable a microphone, then try again.",
        NotReadableError:
          "The microphone is busy or unavailable. Close other apps using it and try again.",
        SecurityError:
          "The browser blocked microphone access. Open the site using HTTPS or localhost and check its permissions.",
      };
      showVoiceHelp(
        messages[microphoneError] ??
          "Could not access the microphone. Check your browser permissions or type your message instead.",
      );
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  const toggleRecording = () => {
    if (isListening) {
      stopRecording();
      return;
    }
    void startRecording();
  };

  const toggleSpokenReplies = () => {
    if (!("speechSynthesis" in window)) {
      showVoiceHelp(
        "This browser cannot play spoken AI replies. You can still use voice input where supported and read the AI's text response.",
      );
      return;
    }

    if (voiceModeEnabled) {
      window.speechSynthesis.cancel();
    }
    setVoiceModeEnabled(!voiceModeEnabled);
  };

  const speak = (text: string) => {
    if (!voiceModeEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const response = new SpeechSynthesisUtterance(text);
    response.lang = voiceLanguage;
    window.speechSynthesis.speak(response);
  };

  const closeVoiceChat = () => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setIsListening(false);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isListening,
    voiceModeEnabled,
    voiceHelpMessage,
    isVoiceHelpOpen,
    voiceLanguage,
    setVoiceLanguage,
    setIsVoiceHelpOpen,
    toggleRecording,
    toggleSpokenReplies,
    speak,
    closeVoiceChat,
  };
}
