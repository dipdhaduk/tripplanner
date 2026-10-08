'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';

export default function AuthForm({ mode }) {
  const register = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim().toLowerCase();

    if (register && trimmedName.length < 2) {
      setError('Please enter your name (at least 2 characters).');
      return;
    }
    if (!trimmedEmail) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      let res;
      if (register) {
        res = await api.post('/auth/register', {
          name: trimmedName,
          email: trimmedEmail,
          password: form.password,
        });
      } else {
        res = await api.post('/auth/login', {
          email: trimmedEmail,
          password: form.password,
        });
      }

      const user = res.data?.data?.user;
      const target = user?.role === 'ADMIN' ? '/admin' : '/dashboard';
      window.location.href = target;
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to continue. Please try again.');
      setBusy(false);
    }
  }

  return (
    <section className="auth-wrap">
      <div className="auth-aside">
        <span className="eyebrow">MAKE ROOM FOR THE GOOD STUFF</span>
        <h1>{register ? 'The world is waiting.' : 'Your next chapter starts here.'}</h1>
        <p>Keep every destination, detail, and day of your journey in one thoughtful place.</p>
        <div className="aside-decoration">↗</div>
      </div>

      <form className="auth-card glass" onSubmit={submit}>
        <span className="eyebrow">{register ? 'CREATE YOUR ACCOUNT' : 'WELCOME BACK'}</span>
        <h2>{register ? 'Start planning' : 'Sign in'}</h2>
        <p className="muted">
          {register
            ? 'A little planning makes a lot of memories.'
            : 'Pick up where your travel plans left off.'}
        </p>

        {register && (
          <label className="field">
            Your name
            <input
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              minLength="2"
            />
          </label>
        )}

        <label className="field">
          Email address
          <input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>

        <label className="field">
          Password
          <input
            type="password"
            autoComplete={register ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength="8"
          />
        </label>

        {error && <div className="error-box">{error}</div>}

        <button className="button button-primary auth-submit" disabled={busy}>
          {busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}
        </button>

        <p className="auth-switch">
          {register ? 'Already have an account?' : 'New to TripPlanner?'}{' '}
          <Link href={register ? '/login' : '/register'}>
            {register ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </form>
    </section>
  );
}
