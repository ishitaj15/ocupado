import Machine from '../models/Machine.js'

describe('Machine Class', () => {

  test('should create a machine with correct properties', () => {
    const machine = new Machine('123', 'Machine 1', 'FREE', null)
    expect(machine.id).toBe('123')
    expect(machine.name).toBe('Machine 1')
    expect(machine.status).toBe('FREE')
  })

  test('isAvailable() should return true when FREE', () => {
    const machine = new Machine('123', 'Machine 1', 'FREE', null)
    expect(machine.isAvailable()).toBe(true)
  })

  test('isAvailable() should return false when ENGAGED', () => {
    const machine = new Machine('123', 'Machine 1', 'ENGAGED', null)
    expect(machine.isAvailable()).toBe(false)
  })

  test('isAvailable() should return false when RESERVED', () => {
    const machine = new Machine('123', 'Machine 1', 'RESERVED', null)
    expect(machine.isAvailable()).toBe(false)
  })

  test('markEngaged() should change status to ENGAGED', () => {
    const machine = new Machine('123', 'Machine 1', 'FREE', null)
    machine.markEngaged()
    expect(machine.status).toBe('ENGAGED')
  })

  test('markFree() should change status to FREE', () => {
    const machine = new Machine('123', 'Machine 1', 'ENGAGED', null)
    machine.markFree()
    expect(machine.status).toBe('FREE')
  })

  test('markReserved() should change status to RESERVED', () => {
    const machine = new Machine('123', 'Machine 1', 'FREE', null)
    machine.markReserved()
    expect(machine.status).toBe('RESERVED')
  })

})