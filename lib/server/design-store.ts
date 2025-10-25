// Store for user-saved Markov chain designs
// Persists to data/designs.json with in-memory caching

import fs from "node:fs"
import { promises as fsp } from "node:fs"
import path from "node:path"

export type MarkovState = {
  id: string
  name: string
  x: number
  y: number
  color: string
}

export type MarkovTransition = {
  id: string
  from: string
  to: string
  probability: number
}

export type MarkovChain = {
  states: MarkovState[]
  transitions: MarkovTransition[]
}

export type SavedDesign = {
  id: string
  name: string
  savedAt: string
  chain: MarkovChain
}

type DesignStore = {
  designs: SavedDesign[]
}

declare global {
  // eslint-disable-next-line no-var
  var __designStore: DesignStore | undefined
  // eslint-disable-next-line no-var
  var __designStoreMtime: number | undefined
}

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "designs.json")

async function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    await fsp.mkdir(DATA_DIR, { recursive: true })
  }
}

function loadFromDiskSync(): DesignStore | null {
  try {
    if (!fs.existsSync(DATA_FILE)) return null
    const stat = fs.statSync(DATA_FILE)
    const raw = fs.readFileSync(DATA_FILE, "utf8")
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedDesign[]
    globalThis.__designStoreMtime = stat.mtimeMs
    return { designs: parsed }
  } catch {
    return null
  }
}

export async function saveDesignStore() {
  try {
    const store = getDesignStore()
    await ensureDataDir()
    await fsp.writeFile(DATA_FILE, JSON.stringify(store.designs, null, 2), "utf8")
    // Update mtime cache
    try {
      const stat = await fsp.stat(DATA_FILE)
      globalThis.__designStoreMtime = stat.mtimeMs
    } catch {}
  } catch (error) {
    console.error("Failed to save design store:", error)
  }
}

export function getDesignStore(): DesignStore {
  // Initialize from disk on first access
  if (!globalThis.__designStore) {
    const loaded = loadFromDiskSync()
    globalThis.__designStore = loaded ?? { designs: [] }
    // Write initial state if file didn't exist
    void saveDesignStore()
  } else {
    // Hot-reload if file was modified externally
    try {
      if (fs.existsSync(DATA_FILE)) {
        const stat = fs.statSync(DATA_FILE)
        if (!globalThis.__designStoreMtime || stat.mtimeMs > globalThis.__designStoreMtime) {
          const reloaded = loadFromDiskSync()
          if (reloaded) {
            globalThis.__designStore = reloaded
          }
        }
      }
    } catch {
      // Keep current in-memory state on error
    }
  }
  return globalThis.__designStore
}
