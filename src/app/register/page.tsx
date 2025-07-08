// app/register/page.tsx
import React, { Suspense } from 'react';
import { RegisterPageClient } from '../../components/Auth/RegisterPageClient';

export default function RegisterPage() {
  return (
    <div>
      <h1>Register</h1>
      <Suspense fallback={<div>Loading registration form...</div>}>
        <RegisterPageClient />
      </Suspense>
    </div>
  );
}
