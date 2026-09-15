import { VoiceRecordingResult } from "../types/incidentTypes";

export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingStartTime = 0;

  /**
   * Check if browser supports audio recording
   */
  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    );
  }

  /**
   * Start microphone audio capture
   */
  async startRecording(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error("Voice recording is not supported in this browser");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioChunks = [];
    this.recordingStartTime = Date.now();

    // Prefer webm/opus or browser default
    const options = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? { mimeType: "audio/webm;codecs=opus" }
      : undefined;

    this.mediaRecorder = new MediaRecorder(stream, options);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250); // collect 250ms chunks
  }

  /**
   * Stop audio capture and return compressed audio blob with simulated transcription fallback
   */
  async stopRecording(language = "en-IN"): Promise<VoiceRecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No active recording found"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        const duration = Math.round((Date.now() - this.recordingStartTime) / 1000);

        // Stop all audio stream tracks
        this.mediaRecorder?.stream.getTracks().forEach((track) => track.stop());

        // Simulated transcription based on regional language selection
        const fallbackTranscripts: Record<string, string> = {
          "en-IN": "Severe road blockage and mud slide ahead near the mountain pass. Heavy vehicles cannot pass safely.",
          "hi-IN": "पहाड़ी मोड़ के पास बड़ा भूस्खलन हुआ है और रास्ता पूरी तरह से बंद है।",
          "as-IN": "পাহাড়ৰ কেঁকুৰিত ডাঙৰ ভূমিস্খলন হৈ ৰাস্তাটো সম্পূৰ্ণৰূপে বন্ধ হৈ পৰিছে।",
          "bn-IN": "পাহাড়ি বাঁকের কাছে বড় ভূমিধস হয়েছে এবং রাস্তা সম্পূর্ণরূপে অবরুদ্ধ।",
        };

        const transcript =
          fallbackTranscripts[language] ||
          fallbackTranscripts["en-IN"];

        resolve({
          audioBlob,
          audioUrl,
          transcript,
          language,
          confidence: 0.92,
          durationSeconds: duration,
        });
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancel active recording
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      this.mediaRecorder.stop();
    }
    this.audioChunks = [];
  }
}

export const voiceService = new VoiceService();
