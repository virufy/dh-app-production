
// import { 
//   RECORDER_WORKLET_CODE, 
//   encodeChunksToFloat32Wav, // Optimized 32-bit encoder
//   StereoChunk 
// } from "../utils/recorderHelpers";

// export class RecorderEngine {
//   private audioCtx: AudioContext | null = null;
//   private mediaStream: MediaStream | null = null;
//   private workletNode: AudioWorkletNode | null = null;
//   private chunks: StereoChunk[] = [];
//   private workletUrl: string | null = null;
//   private onStopCallback: ((blob: Blob) => void) | null = null;
//   private maxDurationTimer: number | null = null;

//   public get isRecording(): boolean {
//     return !!(this.audioCtx && this.audioCtx.state === 'running');
//   }

//   public get sampleRate(): number {
//     return this.audioCtx?.sampleRate || 44100;
//   }

//   // --- Start Logic ---
//   async start(maxDurationMs: number = 40000): Promise<void> {
//     this.cleanup(); 

//     // 1. Get Microphone Stream
//     const stream = await navigator.mediaDevices.getUserMedia({
//       audio: {
//         echoCancellation: false,
//         noiseSuppression: false,
//         autoGainControl: false,
//         channelCount: 2, 
//       },
//     });
//     this.mediaStream = stream;

//     // 2. Initialize Audio Context with FORCED 44100 Hz
//     const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    
//     // Uses the system default
//     const ctx = new AC({ }); 
//     this.audioCtx = ctx;

//     // 3. Load Worklet
//     const blob = new Blob([RECORDER_WORKLET_CODE], { type: "application/javascript" });
//     this.workletUrl = URL.createObjectURL(blob);
    
//     await ctx.audioWorklet.addModule(this.workletUrl);

//     // 4. Connect Nodes
//     const source = ctx.createMediaStreamSource(stream);
//     this.workletNode = new AudioWorkletNode(ctx, "recorder-processor");

//     this.chunks = [];
//     this.workletNode.port.onmessage = (event) => {
//       this.chunks.push(event.data); 
//     };

//     source.connect(this.workletNode);
//     this.workletNode.connect(ctx.destination);

//     console.log(`[Recorder] Started at ${ctx.sampleRate}Hz (32-bit Stereo)`);

//     // 5. Set Auto-Stop Timer
//     this.maxDurationTimer = window.setTimeout(() => {
//       this.stop(true); // Auto-stop = true
//     }, maxDurationMs);
//   }

//   // --- Stop Logic ---
//   async stop(isAutoStop: boolean = false): Promise<Blob | null> {
//     if (this.maxDurationTimer) clearTimeout(this.maxDurationTimer);

//     // 1. Shutdown Audio Graph
//     if (this.mediaStream) {
//       this.mediaStream.getTracks().forEach((t) => t.stop());
//       this.mediaStream = null;
//     }
//     if (this.workletNode) {
//       this.workletNode.disconnect();
//       this.workletNode = null;
//     }
//     if (this.audioCtx && this.audioCtx.state !== 'closed') {
//       await this.audioCtx.close();
//       this.audioCtx = null;
//     }

//     // 2. Check Data
//     if (this.chunks.length === 0) return null;

//     // 3. Encode directly from chunks (Memory Optimized)
//     const blob = encodeChunksToFloat32Wav(this.chunks, this.sampleRate);
//     this.chunks = []; // Clear memory

//     // 4. Log Sizes
//     const binarySize = blob.size;
//     const binaryMB = (binarySize / (1024 * 1024)).toFixed(2);
//     // Base64 is approx 1.33x binary size
//     const base64Size = Math.ceil(binarySize / 3) * 4;
//     const base64MB = (base64Size / (1024 * 1024)).toFixed(2);

//     console.log(`[Recorder]  Binary Size: ${binaryMB} MB`);
//     console.log(`[Recorder]  Base64 Size: ${base64MB} MB`);
    
//     // if (base64Size > 6 * 1024 * 1024) {
//     //   console.warn(`[Recorder] ⚠️ CRITICAL: File exceeds AWS Lambda 6MB limit! Upload will likely fail.`);
//     // }

//     if (isAutoStop && this.onStopCallback) {
//       this.onStopCallback(blob);
//     }

//     return blob;
//   }

//   // --- Cleanup Logic ---
//   cleanup() {
//     if (this.maxDurationTimer) clearTimeout(this.maxDurationTimer);
//     if (this.mediaStream) this.mediaStream.getTracks().forEach((t) => t.stop());
//     if (this.workletNode) try { this.workletNode.disconnect(); } catch (e) {}
//     if (this.audioCtx) try { this.audioCtx.close(); } catch (e) {}
//     if (this.workletUrl) URL.revokeObjectURL(this.workletUrl);
    
//     this.mediaStream = null;
//     this.workletNode = null;
//     this.audioCtx = null;
//     this.workletUrl = null;
//     this.chunks = [];
//   }

//   public setOnStop(cb: (blob: Blob) => void) {
//     this.onStopCallback = cb;
//   }
// }



// src/services/RecorderEngine.ts

import { 
  RECORDER_WORKLET_CODE, 
  encodeChunksToFloat32Wav, // Keeping your original 32-bit function
  StereoChunk 
} from "../utils/recorderHelpers";

export class RecorderEngine {
  private audioCtx: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private chunks: StereoChunk[] = [];
  private workletUrl: string | null = null;
  private onStopCallback: ((blob: Blob) => void) | null = null;
  private maxDurationTimer: number | null = null;

  public get isRecording(): boolean {
    return !!(this.audioCtx && this.audioCtx.state === 'running');
  }

  public get sampleRate(): number {
    // Falls back to 44100 only if ctx is missing, otherwise uses system default (usually 48000)
    return this.audioCtx?.sampleRate || 44100;
  }

  async start(maxDurationMs: number = 40000): Promise<void> {
    this.cleanup();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 2, 
      },
    });
    this.mediaStream = stream;

    // Remove the forced sampleRate option to allow system default (prevent sample rate conversion artifacts)
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC(); 
    this.audioCtx = ctx;

    const blob = new Blob([RECORDER_WORKLET_CODE], { type: "application/javascript" });
    this.workletUrl = URL.createObjectURL(blob);
    
    await ctx.audioWorklet.addModule(this.workletUrl);

    const source = ctx.createMediaStreamSource(stream);
    this.workletNode = new AudioWorkletNode(ctx, "recorder-processor");

    this.chunks = [];
    this.workletNode.port.onmessage = (event) => {
      this.chunks.push(event.data); 
    };

    source.connect(this.workletNode);
    this.workletNode.connect(ctx.destination);

    console.log(`[Recorder] Started at ${ctx.sampleRate}Hz (32-bit Stereo)`);

    this.maxDurationTimer = window.setTimeout(() => {
      this.stop(true);
    }, maxDurationMs);
  }

  async stop(isAutoStop: boolean = false): Promise<Blob | null> {
    if (this.maxDurationTimer) clearTimeout(this.maxDurationTimer);

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      await this.audioCtx.close();
      this.audioCtx = null;
    }

    if (this.chunks.length === 0) return null;

    //  Passing 'this.sampleRate' ensures the WAV header matches the actual recording
    const blob = encodeChunksToFloat32Wav(this.chunks, this.sampleRate);
    
    this.chunks = []; 

    const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
    console.log(`[Recorder] Final Size: ${sizeMB} MB`);

    if (isAutoStop && this.onStopCallback) {
      this.onStopCallback(blob);
    }

    return blob;
  }

  cleanup() {
    if (this.maxDurationTimer) clearTimeout(this.maxDurationTimer);
    if (this.mediaStream) this.mediaStream.getTracks().forEach((t) => t.stop());
    if (this.workletNode) try { this.workletNode.disconnect(); } catch (e) {}
    if (this.audioCtx) try { this.audioCtx.close(); } catch (e) {}
    if (this.workletUrl) URL.revokeObjectURL(this.workletUrl);
    
    this.mediaStream = null;
    this.workletNode = null;
    this.audioCtx = null;
    this.workletUrl = null;
    this.chunks = [];
  }

  public setOnStop(cb: (blob: Blob) => void) {
    this.onStopCallback = cb;
  }
}