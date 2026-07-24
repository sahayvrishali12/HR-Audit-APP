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

export const SEED_USERNAME = "admin@hrgovernance.com"

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
    password: "falcon25",
    name: "Alex Carter",
    designation: "HR Manager",
    role: "admin",
  },
  {
    id: "user-2",
    username: "hr.manager@hrgovernance.com",
    password: "harbor42",
    name: "Maya Fernandes",
    designation: "HR Manager",
    role: "hr_manager",
  },
  {
    id: "user-3",
    username: "hr.employee@hrgovernance.com",
    password: "comet19",
    name: "Jordan Lee",
    designation: "HR Employee",
    role: "hr_employee",
  },
  {
    id: "user-4",
    username: "it.guy@hrgovernance.com",
    password: "nimbus07",
    name: "Sam Winters",
    designation: "IT Administrator",
    role: "it_guy",
  },
]

// Serializes all reads/writes to users.json within this process. Without this,
// concurrent create/delete calls can race (read-modify-write) and silently drop users.
let queue: Promise<unknown> = Promise.resolve()
function withLock<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

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
  return withLock(async () => {
    const users = await readUsers()
    const user = users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    if (!user) return null
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) return null
    return { id: user.id, username: user.username, name: user.name, designation: user.designation, role: user.role }
  })
}

export async function getUserById(id: string) {
  return withLock(async () => {
    const users = await readUsers()
    const user = users.find((u) => u.id === id)
    if (!user) return null
    return { id: user.id, username: user.username, name: user.name, designation: user.designation, role: user.role }
  })
}

export interface PublicUser {
  id: string
  username: string
  name: string
  designation: string
  role: Role
}

export async function listUsers(): Promise<PublicUser[]> {
  return withLock(async () => {
    const users = await readUsers()
    return users
      .map((u) => ({ id: u.id, username: u.username, name: u.name, designation: u.designation, role: u.role }))
      .sort((a, b) => a.username.localeCompare(b.username))
  })
}

export async function usernameTaken(username: string): Promise<boolean> {
  return withLock(async () => {
    const users = await readUsers()
    return users.some((u) => u.username.toLowerCase() === username.toLowerCase())
  })
}

export async function deleteUser(id: string): Promise<boolean> {
  return withLock(async () => {
    const users = await readUsers()
    const next = users.filter((u) => u.id !== id)
    if (next.length === users.length) return false
    await fs.writeFile(FILE, JSON.stringify(next, null, 2))
    return true
  })
}

export async function createUser(input: {
  username: string
  password: string
  name: string
  designation: string
  role: Role
}): Promise<PublicUser | null> {
  return withLock(async () => {
    const users = await readUsers()
    if (users.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
      return null
    }
    const newUser: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      username: input.username,
      passwordHash: await hashPassword(input.password),
      name: input.name,
      designation: input.designation,
      role: input.role,
    }
    users.push(newUser)
    await fs.writeFile(FILE, JSON.stringify(users, null, 2))
    return { id: newUser.id, username: newUser.username, name: newUser.name, designation: newUser.designation, role: newUser.role }
  })
}
