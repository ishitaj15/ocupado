class Machine {
  constructor(id, name, status, qrUrl) {
    this.id = id
    this.name = name
    this.status = status   // FREE, ENGAGED, RESERVED
    this.qrUrl = qrUrl
  }

  markEngaged() {
    this.status = 'ENGAGED'
    return this
  }

  markFree() {
    this.status = 'FREE'
    return this
  }

  markReserved() {
    this.status = 'RESERVED'
    return this
  }

  isAvailable() {
    return this.status === 'FREE'
  }
}

export default Machine