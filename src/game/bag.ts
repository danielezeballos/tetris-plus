import { PIECE_KINDS, type PieceKind } from './constants';

export class SevenBag {
  private queue: PieceKind[] = [];

  private refill(): void {
    const bag = [...PIECE_KINDS];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    this.queue.push(...bag);
  }

  next(): PieceKind {
    if (this.queue.length === 0) {
      this.refill();
    }
    return this.queue.shift()!;
  }

  peek(count: number): PieceKind[] {
    while (this.queue.length < count) {
      this.refill();
    }
    return this.queue.slice(0, count);
  }

  reset(): void {
    this.queue = [];
  }
}
