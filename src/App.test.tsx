import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders the application shell', () => {
  render(<App />)
  expect(screen.getByRole('heading', { level: 1, name: 'React Gantt Chart' })).toBeInTheDocument()
})
