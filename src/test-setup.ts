/// <reference types="node" />
import '@angular/compiler';
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

beforeAll(async () => {
  await resolveComponentResources((url: string) => {
    const filePath = resolve(process.cwd(), 'src', url.replace(/^\.\//, ''));
    try {
      const content = readFileSync(filePath, 'utf-8');
      return Promise.resolve(new Response(content));
    } catch {
      return Promise.resolve(new Response(''));
    }
  });
});