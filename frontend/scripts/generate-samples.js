import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { AudioContext } from 'web-audio-api'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function generateKickDrum(context, duration = 0.1) {
  const sampleRate = context.sampleRate
  const samples = duration * sampleRate
  const buffer = context.createBuffer(1, samples, sampleRate)
  const data = buffer.getChannelData(0)

  const frequency = 150
  const decay = 5.0

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    const amplitude = Math.exp(-decay * t)
    data[i] = amplitude * Math.sin(2 * Math.PI * frequency * t)
  }

  return buffer
}

function generateSnareDrum(context, duration = 0.1) {
  const sampleRate = context.sampleRate
  const samples = duration * sampleRate
  const buffer = context.createBuffer(1, samples, sampleRate)
  const data = buffer.getChannelData(0)

  const frequency = 200
  const noiseAmount = 0.5
  const decay = 10.0

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    const amplitude = Math.exp(-decay * t)
    const noise = (Math.random() * 2 - 1) * noiseAmount
    const tone = Math.sin(2 * Math.PI * frequency * t)
    data[i] = amplitude * (noise + tone)
  }

  return buffer
}

function generateHiHat(context, duration = 0.1) {
  const sampleRate = context.sampleRate
  const samples = duration * sampleRate
  const buffer = context.createBuffer(1, samples, sampleRate)
  const data = buffer.getChannelData(0)

  const decay = 15.0

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate
    const amplitude = Math.exp(-decay * t)
    const noise = Math.random() * 2 - 1
    data[i] = amplitude * noise
  }

  return buffer
}

function floatTo16BitPCM(output, offset, input) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, input[i]))
    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }
}

function writeWAV(buffer, filepath) {
  const arrayBuffer = new ArrayBuffer(44 + buffer.length * 2)
  const view = new DataView(arrayBuffer)
  const channels = 1
  const sampleRate = buffer.sampleRate

  /* RIFF identifier */
  writeString(view, 0, 'RIFF')
  /* RIFF chunk length */
  view.setUint32(4, 36 + buffer.length * 2, true)
  /* RIFF type */
  writeString(view, 8, 'WAVE')
  /* format chunk identifier */
  writeString(view, 12, 'fmt ')
  /* format chunk length */
  view.setUint32(16, 16, true)
  /* sample format (raw) */
  view.setUint16(20, 1, true)
  /* channel count */
  view.setUint16(22, channels, true)
  /* sample rate */
  view.setUint32(24, sampleRate, true)
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true)
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, channels * 2, true)
  /* bits per sample */
  view.setUint16(34, 16, true)
  /* data chunk identifier */
  writeString(view, 36, 'data')
  /* data chunk length */
  view.setUint32(40, buffer.length * 2, true)
  /* data */
  floatTo16BitPCM(view, 44, buffer.getChannelData(0))

  fs.writeFileSync(filepath, Buffer.from(arrayBuffer))
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

async function generateSamples() {
  const context = new AudioContext()
  const samplesDir = path.join(path.dirname(__dirname), 'public', 'samples')

  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true })
  }

  console.log('Generating samples...')

  const kick = generateKickDrum(context)
  const snare = generateSnareDrum(context)
  const hihat = generateHiHat(context)

  writeWAV(kick, path.join(samplesDir, 'kick.wav'))
  writeWAV(snare, path.join(samplesDir, 'snare.wav'))
  writeWAV(hihat, path.join(samplesDir, 'hihat.wav'))

  console.log('Samples generated successfully!')
  process.exit(0)
}

generateSamples().catch((error) => {
  console.error('Failed to generate samples:', error)
  process.exit(1)
}) 