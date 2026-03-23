"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
class MemoryManager {
    constructor(maxSize = 10) {
        this.memory = [];
        this.maxSize = maxSize;
    }
    addInteraction(interaction) {
        this.memory.push(interaction);
        if (this.memory.length > this.maxSize) {
            // Summarize old interactions instead of deleting
            const summary = `Summary: ${this.memory.slice(0, this.maxSize / 2).join(' ')}...`;
            this.memory = [summary, ...this.memory.slice(this.maxSize / 2)];
        }
    }
    getHistory() {
        return [...this.memory];
    }
    clearMemory() {
        this.memory = [];
    }
}
exports.MemoryManager = MemoryManager;
