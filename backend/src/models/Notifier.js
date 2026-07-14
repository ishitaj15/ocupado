// Base class — defines the contract (abstraction)
// Any notifier must implement send(); the base refuses to be used directly.
class Notifier {
  send(message, recipient) {
    throw new Error('send() must be implemented by subclass')
  }
}

// Real-time notification via Socket.io
class SocketNotifier extends Notifier {
  constructor(io) {
    super()
    this.io = io
  }

  send(message, userId) {
    this.io.to(`user_${userId}`).emit('notification', {
      message,
      timestamp: new Date(),
    })
  }
}

export { Notifier, SocketNotifier }