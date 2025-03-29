class EventEmitter {
  static listeners = new Map();
  
  // Define events as static constants
  static Events = {
    DIET_RECOMMENDATIONS_UPDATED: 'dietRecommendationsUpdated',
    WORKOUT_RECOMMENDATIONS_UPDATED: 'workoutRecommendationsUpdated',
    MENTAL_HEALTH_RECOMMENDATIONS_UPDATED: 'mentalHealthRecommendationsUpdated'
  };

  static on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  static off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  static emit(event, data) {
    console.log(`🔹 EventEmitter: Emitting ${event} event with data:`, data);
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in ${event} event handler:`, error);
        }
      });
    }
  }
}

export { EventEmitter };
