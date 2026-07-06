-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Machines table
CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'FREE' CHECK (status IN ('FREE', 'ENGAGED', 'RESERVED')),
  qr_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'NOTIFIED', 'CONFIRMED', 'EXPIRED')),
  joined_at TIMESTAMP DEFAULT NOW()
);

-- OTP table (for Twilio OTP auth)
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);