import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./pages/Dashboard', () => () => <div>Dashboard Page</div>);
jest.mock('./pages/Players', () => () => <div>Players Page</div>);
jest.mock('./pages/Teams', () => () => <div>Teams Page</div>);
jest.mock('./pages/Analytics', () => () => <div>Comparison Page</div>);
jest.mock('./pages/Timeline', () => () => <div>Timeline Page</div>);

test('renders dashboard navigation content', () => {
  render(<App />);
  expect(screen.getByText(/dashboard page/i)).toBeInTheDocument();
  expect(screen.getByText(/players/i)).toBeInTheDocument();
});
