export class MemoryManager {
    private memory: string[] = [];
    private maxSize: number;

    constructor(maxSize: number = 10) {
        this.maxSize = maxSize;
    }

    addInteraction(interaction: string): void {
        this.memory.push(interaction);
        if (this.memory.length > this.maxSize) {
            // Summarize old interactions instead of deleting
            const summary = `Summary: ${this.memory.slice(0, this.maxSize / 2).join(' ')}...`;
            this.memory = [summary, ...this.memory.slice(this.maxSize / 2)];
        }
    }

    getHistory(): string[] {
        return [...this.memory];
    }

    clearMemory(): void {
        this.memory = [];
    }
}