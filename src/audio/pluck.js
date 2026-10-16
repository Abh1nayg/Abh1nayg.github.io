// Karplus-Strong plucked string: a burst of noise circulating in a delay line,
// averaged each pass so high frequencies decay faster, like a real string.
const freqs = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63] // E A D G B E
let ctx

export function pluck(index) {
  const freq = freqs[index]
  if (!freq) return

  // Created lazily inside the first click: browsers block audio before interaction.
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') ctx.resume()

  const sr = ctx.sampleRate
  const n = Math.round(sr / freq)
  const length = sr * 2
  const buffer = ctx.createBuffer(1, length, sr)
  const out = buffer.getChannelData(0)

  const line = new Float32Array(n)
  for (let i = 0; i < n; i++) line[i] = Math.random() * 2 - 1

  for (let i = 0; i < length; i++) {
    const a = i % n
    const b = (i + 1) % n
    out[i] = line[a]
    line[a] = 0.996 * 0.5 * (line[a] + line[b])
  }

  const src = ctx.createBufferSource()
  src.buffer = buffer
  const gain = ctx.createGain()
  const t = ctx.currentTime
  gain.gain.setValueAtTime(0.35, t)
  gain.gain.setValueAtTime(0.35, t + 1.6)
  gain.gain.linearRampToValueAtTime(0, t + 2)
  src.connect(gain).connect(ctx.destination)
  src.start()
}
