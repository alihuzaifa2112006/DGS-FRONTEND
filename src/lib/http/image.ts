/* ------------------------------------------------------------------
   Image sniffing for uploads.

   The browser-supplied `file.type` is attacker-controlled — a PHP script
   renamed to .png arrives claiming to be `image/png`. We ignore it and
   read the magic bytes instead, then serve whatever we detected rather
   than whatever we were told.
   ------------------------------------------------------------------ */

export type ImageKind = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'

export interface SniffResult {
  contentType: ImageKind
  width: number | null
  height: number | null
}

export function sniffImage(buf: Buffer): SniffResult | null {
  if (buf.length < 16) return null

  // PNG — 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) {
    // IHDR is always the first chunk: width/height are at bytes 16..24.
    const width = buf.length >= 24 ? buf.readUInt32BE(16) : null
    const height = buf.length >= 24 ? buf.readUInt32BE(20) : null
    return { contentType: 'image/png', width, height }
  }

  // JPEG — FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { contentType: 'image/jpeg', ...jpegSize(buf) }
  }

  // GIF — "GIF87a" / "GIF89a"
  if (buf.subarray(0, 3).toString('latin1') === 'GIF') {
    return {
      contentType: 'image/gif',
      width: buf.readUInt16LE(6),
      height: buf.readUInt16LE(8),
    }
  }

  // WebP — "RIFF" .... "WEBP"
  if (
    buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buf.subarray(8, 12).toString('latin1') === 'WEBP'
  ) {
    return { contentType: 'image/webp', ...webpSize(buf) }
  }

  return null
}

/** Walks the JPEG segment chain to the frame header that carries the size. */
function jpegSize(buf: Buffer): { width: number | null; height: number | null } {
  let offset = 2
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++
      continue
    }
    const marker = buf[offset + 1]!
    // SOF0..SOF15, skipping the non-frame markers in that range.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) }
    }
    const length = buf.readUInt16BE(offset + 2)
    if (length < 2) break
    offset += 2 + length
  }
  return { width: null, height: null }
}

function webpSize(buf: Buffer): { width: number | null; height: number | null } {
  const format = buf.subarray(12, 16).toString('latin1')
  try {
    if (format === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
    }
    if (format === 'VP8L') {
      const bits = buf.readUInt32LE(21)
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
    }
    if (format === 'VP8X') {
      // VP8X stores canvas size as two 24-bit little-endian values, minus one.
      const w = buf[24]! | (buf[25]! << 8) | (buf[26]! << 16)
      const h = buf[27]! | (buf[28]! << 8) | (buf[29]! << 16)
      return { width: w + 1, height: h + 1 }
    }
  } catch {
    /* fall through — dimensions are advisory, the content type is what matters */
  }
  return { width: null, height: null }
}

/**
 * Normalises whatever the driver hands back for a binary field into bytes.
 *
 * With `.lean()` the MongoDB driver returns a BSON `Binary`, not a Buffer.
 * `new Uint8Array(binary)` on one of those yields an EMPTY array rather than
 * throwing, which serves a 200 with a zero-length body — so this conversion
 * has to be explicit.
 */
export function toBytes(data: unknown): Uint8Array<ArrayBuffer> {
  // Always copied into a plain ArrayBuffer: it detaches the response body
  // from the driver's pooled memory, and gives `BodyInit` the exact
  // `Uint8Array<ArrayBuffer>` it requires.
  const copy = (src: Uint8Array): Uint8Array<ArrayBuffer> => {
    const out = new Uint8Array(new ArrayBuffer(src.byteLength))
    out.set(src)
    return out
  }

  if (data instanceof Uint8Array) return copy(data) // covers Buffer too

  // BSON Binary — `.buffer` is the underlying Node Buffer.
  const wrapped = (data as { buffer?: unknown })?.buffer
  if (wrapped instanceof Uint8Array) return copy(wrapped)

  // Older driver shapes expose the bytes only through `.value()`.
  const asValue = (data as { value?: (raw?: boolean) => unknown })?.value
  if (typeof asValue === 'function') {
    const v = asValue.call(data, true)
    if (v instanceof Uint8Array) return copy(v)
  }

  if (data instanceof ArrayBuffer) return copy(new Uint8Array(data))

  return new Uint8Array(new ArrayBuffer(0))
}
