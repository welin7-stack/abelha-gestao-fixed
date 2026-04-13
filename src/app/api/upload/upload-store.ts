import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'

const UPLOAD_DIR = '/tmp/abelha-uploads'

interface ChunkInfo {
  sessionId: string
  fileName: string
  totalChunks: number
  receivedChunks: number[]
  mimeType: string
}

async function ensureDir() {
  await mkdir(UPLOAD_DIR, { recursive: true })
}

export async function saveChunk(sessionId: string, chunkIndex: number, data: Buffer, fileName: string, totalChunks: number, mimeType: string) {
  await ensureDir()
  const chunkPath = join(UPLOAD_DIR, `${sessionId}_${chunkIndex}`)
  await writeFile(chunkPath, data)

  const metaPath = join(UPLOAD_DIR, `${sessionId}.meta.json`)
  let meta: ChunkInfo
  try {
    const raw = await readFile(metaPath, 'utf-8')
    meta = JSON.parse(raw)
  } catch {
    meta = { sessionId, fileName, totalChunks, receivedChunks: [], mimeType }
  }
  if (!meta.receivedChunks.includes(chunkIndex)) {
    meta.receivedChunks.push(chunkIndex)
  }
  await writeFile(metaPath, JSON.stringify(meta))
  return { received: meta.receivedChunks.length, total: totalChunks }
}

export async function assembleFile(sessionId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string } | null> {
  const metaPath = join(UPLOAD_DIR, `${sessionId}.meta.json`)
  let meta: ChunkInfo
  try {
    const raw = await readFile(metaPath, 'utf-8')
    meta = JSON.parse(raw)
  } catch {
    return null
  }
  if (meta.receivedChunks.length !== meta.totalChunks) return null

  const buffers: Buffer[] = []
  for (let i = 0; i < meta.totalChunks; i++) {
    const chunkPath = join(UPLOAD_DIR, `${sessionId}_${i}`)
    try {
      const chunk = await readFile(chunkPath)
      buffers.push(chunk)
      await unlink(chunkPath).catch(() => {})
    } catch {
      return null
    }
  }
  await unlink(metaPath).catch(() => {})
  return { buffer: Buffer.concat(buffers), fileName: meta.fileName, mimeType: meta.mimeType }
}

export async function cleanupSession(sessionId: string) {
  const metaPath = join(UPLOAD_DIR, `${sessionId}.meta.json`)
  let meta: ChunkInfo
  try {
    const raw = await readFile(metaPath, 'utf-8')
    meta = JSON.parse(raw)
  } catch {
    return
  }
  for (const idx of meta.receivedChunks) {
    await unlink(join(UPLOAD_DIR, `${sessionId}_${idx}`)).catch(() => {})
  }
  await unlink(metaPath).catch(() => {})
}
