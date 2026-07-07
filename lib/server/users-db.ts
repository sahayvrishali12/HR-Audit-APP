import { promises as fs } from "fs"
import path from "path"
import { hashPassword, verifyPassword } from "./crypto"

interface StoredUser {
  id: string
  username: string
  passwordHash: string
  name: string
  designation: string
}

export const SEED_USERNAME = "admin"
export const SEED_PASSWORD = "Audit@123"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE = path.join(DATA_DIR, "users.json")

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(FILE)
  } catch {
    const seeded: StoredUser[] = [
      {
        id: "user-1",
        username: SEED_USERNAME,
        passwordHash: await hashPassword(SEED_PASSWORD),
        name: "BBB",
        designation: "HR Manager",
      },
    ]
    await fs.writeFile(FILE, JSON.stringify(seeded, null, 2))
  }
}

async function readUsers(): Promise<StoredUser[]> {
  await ensureFile()
  const raw = await fs.readFile(FILE, "utf-8")
  return JSON.parse(raw) as StoredUser[]
}

export async function verifyCredentials(username: string, password: string) {
  const users = await readUsers()
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase())
  if (!user) return null
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return null
  return { id: user.id, username: user.username, name: user.name, designation: user.designation }
}

export async function getUserById(id: string) {
  const users = await readUsers()
  const user = users.find((u) => u.id === id)
  if (!user) return null
  return { id: user.id, username: user.username, name: user.name, designation: user.designation }
}
