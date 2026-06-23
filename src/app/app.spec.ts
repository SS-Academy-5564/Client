import '@angular/compiler'
import { describe, expect, it } from 'vitest'
import { App } from './app'

describe('App', () => {
  it('has the expected title', () => {
    const app = new App()
    expect(app.title()).toBe('Client')
  })
})
