import { EventEmitter } from 'events';
import type { BotEvent } from './types.js';

class EventBus extends EventEmitter {
  emit(event: string, data: BotEvent): boolean {
    return super.emit(event, data);
  }

  on(event: string, listener: (data: BotEvent) => void): this {
    return super.on(event, listener);
  }

  publish(event: BotEvent): void {
    this.emit(event.type, event);
    this.emit('*', event);  // wildcard for dashboard subscribers
  }
}

export const eventBus = new EventBus();
eventBus.setMaxListeners(50);
