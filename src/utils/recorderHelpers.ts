
// export const RECORDER_WORKLET_CODE = `
// class RecorderProcessor extends AudioWorkletProcessor {
//   constructor() {
//     super();
//     this.bufferSize = 4096;
//     this.sampleCount = 0;
//     // Buffer for 2 channels (Stereo)
//     this.buffers = [new Float32Array(this.bufferSize), new Float32Array(this.bufferSize)];
//   }

//   process(inputs, outputs, parameters) {
//     const input = inputs[0];
//     if (!input || input.length === 0) return true;

//     const channel1Input = input[0];
//     // Force Stereo: If input is mono, copy Ch1 to Ch2. If stereo, use Ch2.
//     const channel2Input = input.length > 1 ? input[1] : input[0]; 

//     for (let i = 0; i < channel1Input.length; i++) {
//       this.buffers[0][this.sampleCount] = channel1Input[i];
//       this.buffers[1][this.sampleCount] = channel2Input[i];
//       this.sampleCount++;

//       // When buffer is full, send to main thread
//       if (this.sampleCount >= this.bufferSize) {
//         const c1 = this.buffers[0].slice(); 
//         const c2 = this.buffers[1].slice();
        
//         this.port.postMessage({ channel1: c1, channel2: c2 }, [c1.buffer, c2.buffer]);
        
//         this.sampleCount = 0;
//       }
//     }
    
//     return true; // Keep processor alive
//   }
// }
// registerProcessor('recorder-processor', RecorderProcessor);
// `;

// export type StereoChunk = {
//   channel1: Float32Array;
//   channel2: Float32Array;
// };

// /**
//  * MEMORY OPTIMIZED 32-BIT ENCODER
//  * Writes chunks directly to the buffer to avoid memory spikes.
//  * Keeps 32-bit Float precision.
//  */
// export function encodeChunksToFloat32Wav(chunks: StereoChunk[], sampleRate: number): Blob {
//   // 1. Calculate Total Samples first
//   const totalSamples = chunks.reduce((acc, cur) => acc + cur.channel1.length, 0);
  
//   // 2. Allocate ONLY the final file buffer
//   // 44 bytes header + (totalSamples * 2 channels * 4 bytes for 32-bit Float)
//   const buffer = new ArrayBuffer(44 + totalSamples * 8); 
//   const view = new DataView(buffer);

//   const writeStr = (offset: number, str: string) => {
//     for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
//   };

//   // 3. Write WAV Header
//   writeStr(0, "RIFF");
//   view.setUint32(4, 36 + totalSamples * 8, true);
//   writeStr(8, "WAVE");
//   writeStr(12, "fmt ");
//   view.setUint32(16, 16, true);
//   view.setUint16(20, 3, true); // Format 3 = IEEE Float
//   view.setUint16(22, 2, true); // 2 Channels (Stereo)
//   view.setUint32(24, sampleRate, true);
//   view.setUint32(28, sampleRate * 8, true); // Byte Rate
//   view.setUint16(32, 8, true); // Block Align (2 * 4)
//   view.setUint16(34, 32, true); // 32-bit
//   writeStr(36, "data");
//   view.setUint32(40, totalSamples * 8, true);

//   // 4. Stream Chunks directly into the buffer
//   let offset = 44;
  
//   for (const chunk of chunks) {
//     const len = chunk.channel1.length;
//     for (let i = 0; i < len; i++) {
//       // Channel 1 (Left) - Write Float32 directly
//       view.setFloat32(offset, chunk.channel1[i], true);
      
//       // Channel 2 (Right) - Write Float32 directly
//       view.setFloat32(offset + 4, chunk.channel2[i], true);
      
//       offset += 8;
//     }
//   }

//   return new Blob([buffer], { type: "audio/wav" });
// }

// export function capitalize(type: string) {
//   if (!type) return "Unknown";
//   return type.charAt(0).toUpperCase() + type.slice(1);
// }



// src/utils/recorderHelpers.ts

export type StereoChunk = {
  channel1: Float32Array;
  channel2: Float32Array;
};

// 1. AudioWorklet Code (Runs on audio thread)
export const RECORDER_WORKLET_CODE = `
class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.sampleCount = 0;
    this.buffers = [new Float32Array(this.bufferSize), new Float32Array(this.bufferSize)];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channel1Input = input[0];
    const channel2Input = input.length > 1 ? input[1] : input[0]; 

    for (let i = 0; i < channel1Input.length; i++) {
      this.buffers[0][this.sampleCount] = channel1Input[i];
      this.buffers[1][this.sampleCount] = channel2Input[i];
      this.sampleCount++;

      if (this.sampleCount >= this.bufferSize) {
        const c1 = this.buffers[0].slice(); 
        const c2 = this.buffers[1].slice();
        this.port.postMessage({ channel1: c1, channel2: c2 }, [c1.buffer, c2.buffer]);
        this.sampleCount = 0;
      }
    }
    return true; 
  }
}
registerProcessor('recorder-processor', RecorderProcessor);
`;

/**
 * Encodes raw Float32 chunks into a valid WAV file.
 * Uses the dynamic sampleRate provided by the AudioContext.
 * FORMAT: 32-bit Float, Stereo (2 Channels)
 */
export function encodeChunksToFloat32Wav(chunks: StereoChunk[], sampleRate: number): Blob {
  const numSamples = chunks.reduce((acc, cur) => acc + cur.channel1.length, 0);

  // 44 bytes header + data length
  const buffer = new ArrayBuffer(44 + numSamples * 8);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  // WAV Header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 8, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 3, true);    // IEEE Float
  view.setUint16(22, 2, true);    // Stereo
  
  // Dynamic Sample Rate
  view.setUint32(24, sampleRate, true); 
  view.setUint32(28, sampleRate * 8, true); 

  view.setUint16(32, 8, true);
  view.setUint16(34, 32, true);   // 32-bit
  
  writeString(36, "data");
  view.setUint32(40, numSamples * 8, true);

  // Data Writing
  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.channel1.length; i++) {
      view.setFloat32(offset, chunk.channel1[i], true);
      offset += 4;
      view.setFloat32(offset, chunk.channel2[i], true);
      offset += 4;
    }
  }

  return new Blob([buffer], { type: "audio/wav" });
}

// 👇 THIS WAS MISSING
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}