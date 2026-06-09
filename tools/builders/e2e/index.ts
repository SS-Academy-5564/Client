import { createBuilder } from '@angular-devkit/architect';
import type { BuilderOutput } from '@angular-devkit/architect';
import type { JsonObject } from '@angular-devkit/core';
import { execSync } from 'child_process';

export default createBuilder((_options: JsonObject, context): Promise<BuilderOutput> => {
  return new Promise((resolve) => {
    try {
      execSync('npx playwright test', {
        cwd: context.currentDirectory,
        stdio: 'inherit',
        env: process.env,
      });
      resolve({ success: true });
    } catch {
      resolve({ success: false });
    }
  });
});
