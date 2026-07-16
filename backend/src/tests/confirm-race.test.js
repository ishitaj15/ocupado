import pg from 'pg'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()
const { Pool } = pg

// A dedicated pool for this test file. We deliberately do NOT import the app's
// pool from db/index.js — that module runs a connection check on import, and
// anything that pulls in server.js would boot Express, Socket.io and the BullMQ
// worker alongside the test. max: 10 so parallel clients are genuinely parallel
// and not serialised by the pool itself.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
})

// The test seeds and tears down everything it needs, so it never depends on
// whatever happens to exist in the dev DB right now.
let studentId
let machineIds = []

const PARALLEL = 3     // three simultaneous confirm attempts
const WINDOW_MS = 100  // deliberate delay between SELECT and UPDATE

beforeEach(async () => {
  studentId = uuidv4()
  machineIds = [uuidv4(), uuidv4(), uuidv4()]

  await pool.query(
    `INSERT INTO students (id, name, email, password, role)
     VALUES ($1, $2, $3, $4, 'student')`,
    [studentId, 'Race Test Student', `race-${studentId}@test.local`, 'not-a-real-hash']
  )

  // Three FREE machines, each already offered to this student (NOTIFIED).
  // This is the state right after notify-next has run.
  for (const machineId of machineIds) {
    await pool.query(
      `INSERT INTO machines (id, name, status) VALUES ($1, $2, 'FREE')`,
      [machineId, `Race Machine ${machineId.slice(0, 4)}`]
    )
    await pool.query(
      `INSERT INTO waitlist (id, machine_id, student_id, status, notified_at)
       VALUES ($1, $2, $3, 'NOTIFIED', NOW())`,
      [uuidv4(), machineId, studentId]
    )
  }
})

// Runs whether the test passes or fails. This matters: the test is EXPECTED to
// fail on unfixed code, and cleanup at the end of the test body would never run
// — leaving a student holding 3 machines, which would corrupt the next run.
afterEach(async () => {
  await pool.query(`DELETE FROM waitlist WHERE student_id = $1`, [studentId])
  await pool.query(`DELETE FROM machines WHERE id = ANY($1)`, [machineIds])
  await pool.query(`DELETE FROM students WHERE id = $1`, [studentId])
})

afterAll(async () => {
  await pool.end()
})

// Mirrors the SELECT COUNT -> check -> UPDATE sequence in confirmMachine.
// The delay in the middle widens the window between read and write so the
// interleaving is reproducible on demand instead of down to luck.
async function attemptConfirm(machineId) {
  const client = await pool.connect()
  try {
    const held = await client.query(
      `SELECT COUNT(*) FROM machines
       WHERE current_user_id = $1 AND status IN ('ENGAGED', 'RESERVED')`,
      [studentId]
    )

    if (parseInt(held.rows[0].count) >= 2) {
      return { confirmed: false }
    }

    await new Promise((resolve) => setTimeout(resolve, WINDOW_MS))

    await client.query(
      `UPDATE machines SET status = 'RESERVED', current_user_id = $1 WHERE id = $2`,
      [studentId, machineId]
    )
    return { confirmed: true }
  } finally {
    client.release()
  }
}

test('a student cannot hold more than 2 machines under concurrent confirms', async () => {
  await Promise.all(machineIds.slice(0, PARALLEL).map((id) => attemptConfirm(id)))

  const held = await pool.query(
    `SELECT COUNT(*) FROM machines
     WHERE current_user_id = $1 AND status IN ('ENGAGED', 'RESERVED')`,
    [studentId]
  )

  expect(parseInt(held.rows[0].count)).toBeLessThanOrEqual(2)
})