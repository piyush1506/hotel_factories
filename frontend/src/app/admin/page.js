'use client';

import React from 'react';
import { AppProvider } from '../../context/AppContext';
import App from '../../components/App';

export default function AdminPage() {
  return (
    <AppProvider initialScreen="admin">
      <App />
    </AppProvider>
  );
}

