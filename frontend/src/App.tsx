import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './routes/router';
import { useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppBootstrap() {
  useAuth();
  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppBootstrap />
    </ErrorBoundary>
  );
}
