// Base class — defines the contract
class Notifier {
  send(message, recipient) {
    throw new Error('send() must be implemented by subclass')
  }
}

// SMS notification via Twilio
class SMSNotifier extends Notifier {
  constructor(twilioClient, fromNumber) {
    super()
    this.twilioClient = twilioClient
    this.fromNumber = fromNumber
  }

  async send(message, phone) {
    return await this.twilioClient.messages.create({
      body: message,
      to: phone,
      from: this.fromNumber
    })
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
      timestamp: new Date()
    })
  }
}

export { Notifier, SMSNotifier, SocketNotifier }