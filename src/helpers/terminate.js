function terminate (server, options = { coredump: false, timeout: 500 }) {
  // Exit function
  const exit = code => {
    options.coredump ? process.abort() : process.exit(code)
  };

  return (code, reason) => (err, promise) => {
    if (err && err instanceof Error) {
      // Log error information, use a proper logging library here :)
      global.log.error(reason, err);
    }

    if(code === 0) {
      global.log.other('Отключение');
    }else {
      global.log.other('Аварийная остановка', reason);
    }

    global.log.save();

    // Attempt a graceful shutdown
    server.close(exit);
    setTimeout(exit, options.timeout).unref();
  }
}

module.exports = terminate;