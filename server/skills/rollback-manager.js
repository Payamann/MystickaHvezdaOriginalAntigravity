/**
 * Rollback Manager - Git-based undo system for skill actions
 * Tracks all changes and allows reverting to previous state
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

/**
 * Tracks execution history with ability to rollback
 */
export class RollbackManager {
  constructor() {
    this.history = [];
    this.currentCommit = null;
  }

  /**
   * Create a savepoint before executing an action
   */
  async createSavepoint(actionId) {
    try {
      // Get current commit hash
      const { stdout } = await execPromise('git rev-parse HEAD', { cwd: rootDir });
      const commitHash = stdout.trim();

      // Create backup branch
      const backupBranch = `backup/${actionId}/${Date.now()}`;
      await execPromise(`git checkout -b ${backupBranch}`, { cwd: rootDir });

      // Return to original branch
      await execPromise('git checkout -', { cwd: rootDir });

      const savepoint = {
        actionId,
        timestamp: new Date().toISOString(),
        commitHash,
        backupBranch,
        filesChanged: []
      };

      this.history.push(savepoint);
      console.log(`📦 Savepoint created for ${actionId}: ${backupBranch}`);

      return savepoint;
    } catch (error) {
      console.error('Failed to create savepoint:', error.message);
      return null;
    }
  }

  /**
   * Record files changed during action execution
   */
  trackChanges(actionId, changedFiles) {
    const lastSavepoint = this.history.find(h => h.actionId === actionId);
    if (lastSavepoint) {
      lastSavepoint.filesChanged = changedFiles;
    }
  }

  /**
   * Rollback to a specific savepoint
   */
  async rollback(savepoint) {
    try {
      if (!savepoint || !savepoint.backupBranch) {
        throw new Error('Invalid savepoint');
      }

      // Stash current changes
      await execPromise('git stash', { cwd: rootDir });

      // Checkout to backup
      await execPromise(`git checkout ${savepoint.backupBranch}`, { cwd: rootDir });

      // Get files from backup
      const { stdout } = await execPromise(
        `git diff --name-only HEAD..${savepoint.commitHash}`,
        { cwd: rootDir }
      );

      // Restore original commit
      await execPromise(`git checkout ${savepoint.commitHash}`, { cwd: rootDir });

      console.log(`✅ Rolled back to ${savepoint.actionId} (${savepoint.timestamp})`);
      console.log(`   Files restored: ${stdout.split('\n').filter(f => f).length}`);

      return true;
    } catch (error) {
      console.error('Rollback failed:', error.message);
      return false;
    }
  }

  /**
   * Rollback to last action
   */
  async rollbackLast() {
    if (this.history.length === 0) {
      console.log('❌ No savepoints available');
      return false;
    }

    const lastSavepoint = this.history[this.history.length - 1];
    return this.rollback(lastSavepoint);
  }

  /**
   * List all savepoints
   */
  listSavepoints() {
    console.log('\n📦 Action History (Savepoints):\n');
    for (let i = 0; i < this.history.length; i++) {
      const sp = this.history[i];
      console.log(`${i + 1}. ${sp.actionId}`);
      console.log(`   Time: ${sp.timestamp}`);
      console.log(`   Commit: ${sp.commitHash.substring(0, 7)}`);
      console.log(`   Files: ${sp.filesChanged.length}`);
      console.log();
    }
  }

  /**
   * Clear old savepoints (keep last N)
   */
  async cleanup(keepCount = 5) {
    try {
      const toRemove = this.history.slice(0, -keepCount);

      for (const sp of toRemove) {
        await execPromise(`git branch -D ${sp.backupBranch}`, { cwd: rootDir });
      }

      this.history = this.history.slice(-keepCount);
      console.log(`🧹 Cleaned up ${toRemove.length} old savepoints`);
    } catch (error) {
      console.error('Cleanup failed:', error.message);
    }
  }

  /**
   * Export history for audit trail
   */
  exportHistory() {
    return {
      total_actions: this.history.length,
      savepoints: this.history.map(sp => ({
        action: sp.actionId,
        timestamp: sp.timestamp,
        commit: sp.commitHash.substring(0, 7),
        files_affected: sp.filesChanged.length
      }))
    };
  }
}

/**
 * Wrapper for SkillAction with rollback support
 */
export function withRollback(action, rollbackManager) {
  const originalHandler = action.handler;

  action.handler = async (context) => {
    // Create savepoint before execution
    const savepoint = await rollbackManager.createSavepoint(action.id);
    if (!savepoint) {
      console.warn('⚠️  Rollback disabled for this action');
    }

    try {
      // Execute handler
      const result = await originalHandler(context);

      // If handler returns files changed, track them
      if (result.files_modified) {
        rollbackManager.trackChanges(action.id, result.files_modified);
      }

      return result;
    } catch (error) {
      // On error, automatically rollback
      if (savepoint) {
        console.log('\n⚠️  Action failed. Rolling back...');
        await rollbackManager.rollback(savepoint);
      }
      throw error;
    }
  };

  return action;
}

export default RollbackManager;
