import { EventEmitter } from 'events';
import sendEmail from './sendEmail.js';

class AsyncQueue extends EventEmitter {
  constructor({ concurrency = 1 } = {}) {
    super();
    this.concurrency = Math.max(1, concurrency);
    this.activeCount = 0;
    this.queue = [];
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.#process();
    });
  }

  #process() {
    while (this.activeCount < this.concurrency && this.queue.length) {
      const { task, resolve, reject } = this.queue.shift();
      this.activeCount += 1;
      Promise.resolve()
        .then(() => task())
        .then((result) => {
          resolve(result);
          this.emit('fulfilled');
        })
        .catch((error) => {
          reject(error);
          this.emit('rejected', error);
        })
        .finally(() => {
          this.activeCount -= 1;
          this.#process();
        });
    }
  }
}

const concurrency = Number(process.env.EMAIL_QUEUE_CONCURRENCY || 3) || 3;
const emailQueue = new AsyncQueue({ concurrency });

export const enqueueEmail = (options) => {
  emailQueue
    .add(() => sendEmail(options))
    .catch((error) => {
      console.error('Queued email failed:', error.message);
    });
};

export default emailQueue;
