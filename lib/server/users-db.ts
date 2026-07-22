import { promises as fs } from "fs"
import path from "path"
import { hashPassword, verifyPassword } from "./crypto"
import type { Role } from "@/lib/roles"

interface StoredUser {
  id: string
  username: string
  passwordHash: string
  name: string
  designation: string
  role: Role
}

export const SEED_USERNAME = "admin"
export const SEED_PASSWORD = "Audit@123"

const DATA_DIR = path.join(process.cwd(), "data")
const FILE = path.join(DATA_DIR, "users.json")

interface SeedDefinition {
  id: string
  username: string
  password: string
  name: string
  designation: string
  role: Role
}

const SEED_DEFINITIONS: SeedDefinition[] = [
  {
    id: "user-1",
    username: SEED_USERNAME,
    password: SEED_PASSWORD,
    name: "Priya Nair",
    designation: "HR Manager",
    role: "admin",
  },
  {
    id: "user-2",
    username: "hr.manager",
    password: SEED_PASSWORD,
    name: "Arjun Mehta",
    designation: "HR Manager",
    role: "hr_manager",
  },
  {
    id: "user-3",
    username: "hr.employee",
    password: SEED_PASSWORD,
    name: "Kavya Iyer",
    designation: "HR Employee",
    role: "hr_employee",
  },
  {
    id: "user-4",
    username: "it.guy",
    password: SEED_PASSWORD,
    name: "Rohan Shah",
    designation: "IT Administrator",
    role: "it_guy",
  },
]

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(FILE)
  } catch {
    const seeded: StoredUser[] = []
    for (const def of SEED_DEFINITIONS) {
      seeded.push({
        id: def.id,
        username: def.username,
        passwordHash: await hashPassword(def.password),
        name: def.name,
        designation: def.designation,
        role: def.role,
      })
    }
    await fs.writeFile(FILE, JSON.stringify(seeded, null, 2))
  }
}

async function migrateUsers(users: StoredUser[]): Promise<StoredUser[]> {
  let changed = false
  for (const user of users) {
    if (!user.role) {
      user.role = user.username === SEED_USERNAME ? "admin" : "hr_employee"
      changed = true
    }
  }
  for (const def of SEED_DEFINITIONS) {
    if (!users.some((u) => u.username.toLowerCase() === def.username.toLowerCase())) {
      users.push({
        id: def.id,
        username: def.username,
        passwordHash: await hashPassword(def.password),
        name: def.name,
        designation: def.designation,
        role: def.role,
      })
      changed = true
    }
  }
  if (changed) {
    await fs.writeFile(FILE, JSON.stringify(users, null, 2))
  }
  return users
}

async function readUsers(): Promise<StoredUser[]> {
  await ensureFile()
  const raw = await fs.readFile(FILE, "utf-8")
  const users = JSON.parse(raw) as StoredUser[]
  return migrateUsers(users)
}

export async function verifyCredentials(username: string, password: string) {
  const users = await readUsers()
  const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase())
  if (!user) return null
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return null
  return { id: user.id, username: user.username, name: user.name, designation: user.designation, role: user.role }
}

export async function getUserById(id: string) {
  const users = await readUsers()
  const user = users.find((u) => u.id === id)
  if (!user) return null
  return { id: user.id, username: user.username, name: user.name, designation: user.designation, role: user.role }
}
