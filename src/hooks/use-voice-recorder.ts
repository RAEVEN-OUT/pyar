// src/hooks/use-voice-recorder.ts
import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useVoiceRecorder() {
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ---------- CLEANUP ----------
  const cleanup = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
      maxTimeoutRef.current = null;
    }

    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  }, []);

  // ---------- START ----------
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      setAudioBlob(null); // reset previous audio

      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];

      const mimeType = mimeTypes.find(type =>
        MediaRecorder.isTypeSupported(type)
      );

      if (!mimeType) {
        throw new Error('No supported audio format found');
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      maxTimeoutRef.current = setTimeout(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === 'recording'
        ) {
          mediaRecorderRef.current.stop();
        }
        toast({
          title: 'Recording limit reached',
          description: 'Voice notes are limited to 60 seconds.',
        });
      }, 60000);
    } catch (error) {
      console.error(error);
      cleanup();
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions.',
      });
    }
  }, [cleanup, toast]);

  // ---------- STOP ----------
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise(resolve => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state !== 'recording') {
        cleanup();
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          cleanup();
          resolve(null);
          return;
        }

        const blob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType,
        });

        setAudioBlob(blob); // 🔥 FIX 1 (store in state)
        cleanup();
        resolve(blob);
      };

      recorder.stop();
    });
  }, [cleanup]);

  // ---------- CANCEL ----------
  const cancelRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }
    setAudioBlob(null);
    cleanup();
  }, [cleanup]);

  // ---------- EXPOSE ----------
  return {
    isRecording,
    recordingTime,
    audioBlob,        // 🔥 FIX 1 exposed
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
