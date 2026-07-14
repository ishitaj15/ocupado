// Waitlist — an in-memory model of the global laundry queue.
// This mirrors the real system's design: ONE global queue for all machines
// (machines are fungible), served first-come-first-served. The production
// app persists this in PostgreSQL; this class encapsulates the same logic
// as a testable domain object (encapsulation + a clean queue abstraction).
class Waitlist {
  constructor() {
    this.queue = [] // student IDs, in join order (FCFS)
  }

  // Add a student to the back of the global queue (if not already waiting)
  addStudent(studentId) {
    if (!this.hasStudent(studentId)) {
      this.queue.push(studentId)
    }
    return this
  }

  // Position in line (1-based); 0 if not in the queue
  getPosition(studentId) {
    const index = this.queue.indexOf(studentId)
    return index === -1 ? 0 : index + 1
  }

  // Peek at who's next without removing them
  peekNext() {
    return this.queue[0] || null
  }

  // Remove and return the next student (FCFS)
  getNext() {
    return this.queue.shift() || null
  }

  // Remove a specific student (e.g. they left the queue or got a machine)
  removeStudent(studentId) {
    this.queue = this.queue.filter((id) => id !== studentId)
    return this
  }

  hasStudent(studentId) {
    return this.queue.includes(studentId)
  }

  isEmpty() {
    return this.queue.length === 0
  }

  size() {
    return this.queue.length
  }
}

export default Waitlist