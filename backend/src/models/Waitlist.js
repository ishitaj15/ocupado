class Waitlist {
  constructor(machineId) {
    this.machineId = machineId
    this.queue = []  // array of student IDs in order
  }

  addStudent(studentId) {
    this.queue.push(studentId)
  }

  getNext() {
    return this.queue.shift()  // removes and returns first student
  }

  isEmpty() {
    return this.queue.length === 0
  }

  size() {
    return this.queue.length
  }

  hasStudent(studentId) {
    return this.queue.includes(studentId)
  }
}

export default Waitlist