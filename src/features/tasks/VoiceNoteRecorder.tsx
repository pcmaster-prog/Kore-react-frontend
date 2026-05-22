// src/features/tasks/VoiceNoteRecorder.tsx
// ─── Grabar/reproducir/subir notas de voz con MediaRecorder API ─────────────

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Upload } from "lucide-react";

interface VoiceNoteRecorderProps {
  onRecordComplete?: (blob: Blob) => void;
  maxDurationSeconds?: number;
}

/** Detecta si el navegador soporta MediaRecorder */
export function isMediaRecorderSupported(): boolean {
  return typeof window !== "undefined" && "MediaRecorder" in window;
}

/** Obtiene el MIME type preferido para audio */
function getPreferredMimeType(): string {
  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export default function VoiceNoteRecorder({
  onRecordComplete,
  maxDurationSeconds = 300,
}: VoiceNoteRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordDuration, setRecordDuration] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const supported = isMediaRecorderSupported();
  const mimeType = getPreferredMimeType();

  // No renderizar si no hay soporte (regla del apéndice)
  if (!supported || !mimeType) return null;

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setRecordedBlob(null);
      setRecordDuration(0);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        audioUrlRef.current = URL.createObjectURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.onerror = () => {
        setError("Error al grabar audio");
        setIsRecording(false);
      };

      recorder.start(1000); // timeslice de 1s para chunks más pequeños
      setIsRecording(true);

      recordIntervalRef.current = setInterval(() => {
        setRecordDuration((prev) => {
          if (prev >= maxDurationSeconds - 1) {
            recorder.stop();
            setIsRecording(false);
            if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      setError("No se pudo acceder al micrófono");
    }
  }, [mimeType, maxDurationSeconds]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const playRecording = useCallback(() => {
    if (!audioUrlRef.current) return;
    const audio = new Audio(audioUrlRef.current);
    audioElementRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setPlaybackTime(0);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };

    audio.onpause = () => {
      setIsPlaying(false);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };

    audio.play();
    setIsPlaying(true);

    playbackIntervalRef.current = setInterval(() => {
      setPlaybackTime(audio.currentTime);
    }, 200);
  }, []);

  const pausePlayback = useCallback(() => {
    audioElementRef.current?.pause();
    setIsPlaying(false);
    if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
  }, []);

  const discardRecording = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setRecordedBlob(null);
    setRecordDuration(0);
    setPlaybackTime(0);
  }, []);

  const handleUpload = useCallback(() => {
    if (recordedBlob && onRecordComplete) {
      onRecordComplete(recordedBlob);
    }
  }, [recordedBlob, onRecordComplete]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl bg-k-bg-card2 border border-k-border p-4 space-y-3">
      {error && (
        <div className="rounded-xl bg-rose-50 text-rose-700 text-xs font-bold px-3 py-2">
          {error}
        </div>
      )}

      {/* Recording state */}
      {isRecording ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30" />
              <div className="relative h-10 w-10 rounded-full bg-rose-500 flex items-center justify-center text-white">
                <Mic className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-rose-600">Grabando...</div>
              <div className="text-xs text-k-text-b font-mono">{formatDuration(recordDuration)}</div>
            </div>
          </div>
          <button
            onClick={stopRecording}
            className="h-10 w-10 rounded-xl bg-k-text-h text-white flex items-center justify-center hover:opacity-90 transition-all"
          >
            <Square className="h-4 w-4" />
          </button>
        </div>
      ) : recordedBlob ? (
        /* Playback state */
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={isPlaying ? pausePlayback : playRecording}
              className="h-10 w-10 rounded-full bg-k-accent-btn text-white flex items-center justify-center hover:opacity-90 transition-all"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-k-accent-btn rounded-full transition-all"
                  style={{
                    width: `${audioElementRef.current?.duration
                      ? (playbackTime / audioElementRef.current.duration) * 100
                      : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-k-text-b mt-1 font-mono">
                <span>{formatDuration(playbackTime)}</span>
                <span>{formatDuration(recordDuration)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={discardRecording}
              className="flex-1 h-9 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-all inline-flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Descartar
            </button>
            <button
              onClick={handleUpload}
              className="flex-1 h-9 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:opacity-90 transition-all inline-flex items-center justify-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Usar audio
            </button>
          </div>
        </div>
      ) : (
        /* Idle state */
        <button
          onClick={startRecording}
          className="w-full h-12 rounded-xl bg-k-bg-sidebar/10 text-k-accent-btn text-sm font-bold hover:bg-k-bg-sidebar/20 transition-all inline-flex items-center justify-center gap-2"
        >
          <Mic className="h-4 w-4" />
          Toca para grabar
        </button>
      )}
    </div>
  );
}
