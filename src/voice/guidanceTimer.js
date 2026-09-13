// One reminder after inactivity, then at most one follow-up 30 seconds later.
// Speech ending postpones a reminder without starting an endless reminder loop.
export class GuidanceTimer {
  constructor(now = 0, delay = 4000) { this.reset(now, delay); }
  reset(now, delay = this.delay) {
    this.delay = delay;
    this.dueAt = now + delay;
    this.count = 0;
  }
  defer(now) { this.dueAt = Math.max(this.dueAt, now + this.delay); }
  take(now) {
    if (this.count >= 2 || now < this.dueAt) return false;
    this.count += 1;
    this.dueAt = now + 30000;
    return true;
  }
}
