import Waitlist from '../models/Waitlist.js'

describe('Waitlist Class', () => {

  test('should create empty waitlist', () => {
    const waitlist = new Waitlist('machine-123')
    expect(waitlist.machineId).toBe('machine-123')
    expect(waitlist.isEmpty()).toBe(true)
    expect(waitlist.size()).toBe(0)
  })

  test('addStudent() should add student to queue', () => {
    const waitlist = new Waitlist('machine-123')
    waitlist.addStudent('student-1')
    expect(waitlist.size()).toBe(1)
    expect(waitlist.isEmpty()).toBe(false)
  })

  test('getNext() should return first student and remove them', () => {
    const waitlist = new Waitlist('machine-123')
    waitlist.addStudent('student-1')
    waitlist.addStudent('student-2')
    const next = waitlist.getNext()
    expect(next).toBe('student-1')
    expect(waitlist.size()).toBe(1)
  })

  test('getNext() should follow FIFO order', () => {
    const waitlist = new Waitlist('machine-123')
    waitlist.addStudent('student-1')
    waitlist.addStudent('student-2')
    waitlist.addStudent('student-3')
    expect(waitlist.getNext()).toBe('student-1')
    expect(waitlist.getNext()).toBe('student-2')
    expect(waitlist.getNext()).toBe('student-3')
  })

  test('hasStudent() should return true if student in queue', () => {
    const waitlist = new Waitlist('machine-123')
    waitlist.addStudent('student-1')
    expect(waitlist.hasStudent('student-1')).toBe(true)
    expect(waitlist.hasStudent('student-2')).toBe(false)
  })

  test('isEmpty() should return true after all students removed', () => {
    const waitlist = new Waitlist('machine-123')
    waitlist.addStudent('student-1')
    waitlist.getNext()
    expect(waitlist.isEmpty()).toBe(true)
  })

})