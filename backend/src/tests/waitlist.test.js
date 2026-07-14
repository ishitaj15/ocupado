import Waitlist from '../models/Waitlist.js'

describe('Waitlist Class (global FCFS queue)', () => {

  test('should create an empty global waitlist', () => {
    const waitlist = new Waitlist()
    expect(waitlist.isEmpty()).toBe(true)
    expect(waitlist.size()).toBe(0)
  })

  test('addStudent() should add a student to the queue', () => {
    const waitlist = new Waitlist()
    waitlist.addStudent('student-1')
    expect(waitlist.size()).toBe(1)
    expect(waitlist.isEmpty()).toBe(false)
  })

  test('addStudent() should not add the same student twice', () => {
    const waitlist = new Waitlist()
    waitlist.addStudent('student-1')
    waitlist.addStudent('student-1')
    expect(waitlist.size()).toBe(1)
  })

  test('getPosition() should return the 1-based position in line', () => {
    const waitlist = new Waitlist()
    waitlist.addStudent('student-1')
    waitlist.addStudent('student-2')
    expect(waitlist.getPosition('student-1')).toBe(1)
    expect(waitlist.getPosition('student-2')).toBe(2)
    expect(waitlist.getPosition('unknown')).toBe(0)
  })

  test('peekNext() should return the first student without removing them', () => {
    const waitlist = new Waitlist()
    waitlist.addStudent('student-1')
    waitlist.addStudent('student-2')
    expect(waitlist.peekNext()).toBe('student-1')
    expect(waitlist.size()).toBe(2) // unchanged
  })

  test('getNext() should return and remove students in FCFS order', () => {
    const waitlist = new Waitlist()
    waitlist.addStudent('student-1')
    waitlist.addStudent('student-2')
    waitlist.addStudent('student-3')
    expect(waitlist.getNext()).toBe('student-1')
    expect(waitlist.getNext()).toBe('student-2')
    expect(waitlist.getNext()).toBe('student-3')
    expect(waitlist.isEmpty()).toBe(true)
  })

  test('removeStudent() should remove a specific student from the queue', () => {
    const waitlist = new Waitlist()
    waitlist.addStudent('student-1')
    waitlist.addStudent('student-2')
    waitlist.removeStudent('student-1')
    expect(waitlist.hasStudent('student-1')).toBe(false)
    expect(waitlist.getPosition('student-2')).toBe(1) // student-2 moves up
  })

  test('hasStudent() should reflect queue membership', () => {
    const waitlist = new Waitlist()
    waitlist.addStudent('student-1')
    expect(waitlist.hasStudent('student-1')).toBe(true)
    expect(waitlist.hasStudent('student-2')).toBe(false)
  })

})