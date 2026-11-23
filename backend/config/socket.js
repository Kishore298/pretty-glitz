// Socket.IO has been retired in favor of lightweight, reliable HTTP polling.
// Safe stubs are maintained for backward compatibility.
module.exports = {
  initSocket: () => null,
  getIO: () => null,
  emitToAdmin: () => false,
  emitToUser: () => false,
};
