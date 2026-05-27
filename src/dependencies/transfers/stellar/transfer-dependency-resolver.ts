class TransferDependencyResolver {
  private adjacencyList: Map<string, Set<string>> = new Map();
  private inDegree: Map<string, number> = new Map();
  private transfers: Set<string> = new Set();

  /**
   * Add a transfer with its dependencies
   * @param transferId - Unique identifier for the transfer
   * @param dependencies - Array of transfer IDs that must complete before this transfer
   */
  addTransfer(transferId: string, dependencies: string[] = []): void {
    // Initialize if not present
    if (!this.adjacencyList.has(transferId)) {
      this.adjacencyList.set(transferId, new Set());
      this.inDegree.set(transferId, 0);
      this.transfers.add(transferId);
    }

    // Process each dependency
    for (const dep of dependencies) {
      // Ensure dependency node exists
      if (!this.adjacencyList.has(dep)) {
        this.adjacencyList.set(dep, new Set());
        this.inDegree.set(dep, 0);
        this.transfers.add(dep);
      }

      // Add edge from dep -> transferId
      if (!this.adjacencyList.get(dep)!.has(transferId)) {
        this.adjacencyList.get(dep)!.add(transferId);
        // Increment in-degree of transferId
        this.inDegree.set(transferId, this.inDegree.get(transferId)! + 1);
      }
    }
  }

  /**
   * Remove a transfer and all its edges
   * @param transferId - Transfer ID to remove
   */
  removeTransfer(transferId: string): void {
    if (!this.transfers.has(transferId)) return;

    // Remove incoming edges (dependencies that point to this transfer)
    for (const [node, edges] of this.adjacencyList.entries()) {
      if (edges.has(transferId)) {
        edges.delete(transferId);
        // Decrement in-degree of transferId
        this.inDegree.set(transferId, this.inDegree.get(transferId)! - 1);
      }
    }

    // Remove outgoing edges (this transfer's dependencies)
    const outgoingEdges = this.adjacencyList.get(transferId);
    if (outgoingEdges) {
      for (const dep of outgoingEdges) {
        // Remove edge from transferId to dep
        // Decrement in-degree of dep
        this.inDegree.set(dep, this.inDegree.get(dep)! - 1);
      }
      outgoingEdges.clear();
    }

    // Clean up
    this.adjacencyList.delete(transferId);
    this.inDegree.delete(transferId);
    this.transfers.delete(transferId);
  }

  /**
   * Get transfers that have no unresolved dependencies (ready to execute)
   * @returns Array of transfer IDs that are ready
   */
  getReadyTransfers(): string[] {
    const ready: string[] = [];
    for (const [transferId, degree] of this.inDegree.entries()) {
      if (degree === 0 && this.transfers.has(transferId)) {
        ready.push(transferId);
      }
    }
    return ready;
  }

  /**
   * Mark a transfer as completed and update dependencies
   * @param transferId - Transfer ID that has completed
   */
  markCompleted(transferId: string): void {
    if (!this.transfers.has(transferId)) return;

    // For each dependent transfer, decrement in-degree
    const dependents = this.adjacencyList.get(transferId);
    if (dependents) {
      for (const dependent of dependents) {
        this.inDegree.set(dependent, this.inDegree.get(dependent)! - 1);
      }
    }

    // Optional: remove the completed transfer from graph to free memory
    // this.removeTransfer(transferId);
  }

  /**
   * Check if there are circular dependencies in the graph
   * @returns True if circular dependencies exist
   */
  hasCircularDependencies(): boolean {
    // Kahn's algorithm for topological sorting
    const inDegreeCopy = new Map(this.inDegree);
    const queue: string[] = [];
    const transfersCopy = new Set(this.transfers);

    // Initialize queue with nodes having zero in-degree
    for (const [transferId, degree] of inDegreeCopy.entries()) {
      if (degree === 0 && transfersCopy.has(transferId)) {
        queue.push(transferId);
      }
    }

    let processedCount = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      processedCount++;

      // Reduce in-degree for each neighbor
      const neighbors = this.adjacencyList.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          inDegreeCopy.set(neighbor, inDegreeCopy.get(neighbor)! - 1);
          if (inDegreeCopy.get(neighbor) === 0 && transfersCopy.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }

    // If not all transfers were processed, there's a cycle
    return processedCount !== transfersCopy.size;
  }

  /**
   * Get a valid execution order for transfers (topological sort)
   * @returns Array of transfer IDs in execution order
   * @throws Error if circular dependencies exist
   */
  getExecutionOrder(): string[] {
    if (this.hasCircularDependencies()) {
      throw new Error('Circular dependencies detected in transfer graph');
    }

    const inDegreeCopy = new Map(this.inDegree);
    const queue: string[] = [];
    const result: string[] = [];
    const transfersCopy = new Set(this.transfers);

    // Initialize queue with nodes having zero in-degree
    for (const [transferId, degree] of inDegreeCopy.entries()) {
      if (degree === 0 && transfersCopy.has(transferId)) {
        queue.push(transferId);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Reduce in-degree for each neighbor
      const neighbors = this.adjacencyList.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          inDegreeCopy.set(neighbor, inDegreeCopy.get(neighbor)! - 1);
          if (inDegreeCopy.get(neighbor) === 0 && transfersCopy.has(neighbor)) {
            queue.push(neighbor);
          }
        }
      }
    }

    return result;
  }

  /**
   * Clear all transfers and dependencies
   */
  clear(): void {
    this.adjacencyList.clear();
    this.inDegree.clear();
    this.transfers.clear();
  }
}

// Export a singleton instance for convenience
export const transferDependencyResolver = new TransferDependencyResolver();
export type { TransferDependencyResolver };