/// <reference types="node" />
import '@angular/compiler';
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { beforeAll } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { basename, join, resolve } from 'path';

class ResizeObserverMock {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  observe(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  unobserve(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  disconnect(): void {}
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver = ResizeObserverMock;

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

function findFileRecursively(dir: string, fileName: string): string | null {
  try {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        const found = findFileRecursively(fullPath, fileName);
        if (found) {
          return found;
        }
      } else if (file === fileName) {
        return fullPath;
      }
    }
  } catch {
    return null;
  }
  return null;
}

beforeAll(async () => {
  await resolveComponentResources((url: string) => {
    const fileName = basename(url);
    const filePath = findFileRecursively(resolve(process.cwd(), 'src'), fileName);
    if (filePath) {
      try {
        const content = readFileSync(filePath, 'utf-8');
        return Promise.resolve(new Response(content));
      } catch {
        return Promise.resolve(new Response(''));
      }
    }
    return Promise.resolve(new Response(''));
  });
});
