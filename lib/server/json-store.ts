import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")

export async function readJsonDict<T>(filename: string): Promise<Record<string, T>> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8")
    return JSON.parse(raw) as Record<string, T>
  } catch {
    return {}
  }
}

export async function writeJsonDict<T>(filename: string, data: Record<string, T>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2))
}
