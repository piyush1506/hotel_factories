class WriteLock {
  constructor() {
    this.queue = Promise.resolve();
  }

  async run(work) {
    const previous = this.queue;
    let release;
    this.queue = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      return await work();
    } finally {
      release();
    }
  }
}

module.exports = WriteLock;

