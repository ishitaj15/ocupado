import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
})

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message)
    return
  }
  console.log('✅ Database connected successfully')
  release()
})

export default pool