'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/axios';

function active(path, href) {
  if (href === '/dashboard') return path === '/dashboard' || path.startsWith('/trips/');
  return path === href || path.startsWith(`${href}/`);
}

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    let mounted = true;
    api.get('/auth/me')
      .then((response) => {
        if (mounted) setUser(response.data.data.user);
      })
      .catch(() => {
        if (mounted) setUser(null);
      });
    setOpen(false);
    return () => {
      mounted = false;
    };
  }, [path]);

  // Warm up page bundles in background for instant navigation
  useEffect(() => {
    const coreRoutes = ['/', '/about', '/reviews', '/contact', '/dashboard', '/profile', '/login', '/register'];
    coreRoutes.forEach((route) => {
      try {
        router.prefetch(route);
      } catch {}
    });
  }, [router]);

  const handleNavClick = (e, href) => {
    setOpen(false);
    if (href === '/#destinations' && path === '/') {
      e.preventDefault();
      const el = document.getElementById('destinations');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', '/#destinations');
      }
    }
  };

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* Continue to the signed-out view if the network is unavailable. */
    } finally {
      setUser(null);
      setOpen(false);
      router.push('/login');
    }
  }

  const initials = user?.name?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  return (
    <header className="topbar">
      <div className="nav-inner">
        <Link
          className="brand"
          href="/"
          prefetch={true}
          onClick={(e) => handleNavClick(e, '/')}
          aria-label="TripPlanner home"
        >
          <span className="brand-mark">TP</span>
          <span>TripPlanner<small>Itinerary Planner</small></span>
        </Link>

        <button
          className="mobile-menu"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="site-navigation"
        >
          <span className={`menu-icon ${open ? 'menu-icon-open' : ''}`} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <nav id="site-navigation" className={open ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
          <Link
            className="nav-link"
            href="/#destinations"
            prefetch={true}
            onClick={(e) => handleNavClick(e, '/#destinations')}
          >
            Destinations
          </Link>
          <Link
            className={`nav-link ${active(path, '/about') ? 'nav-link-active' : ''}`}
            href="/about"
            prefetch={true}
            onClick={(e) => handleNavClick(e, '/about')}
          >
            About us
          </Link>
          <Link
            className={`nav-link ${active(path, '/reviews') ? 'nav-link-active' : ''}`}
            href="/reviews"
            prefetch={true}
            onClick={(e) => handleNavClick(e, '/reviews')}
          >
            Reviews
          </Link>
          <Link
            className={`nav-link ${active(path, '/contact') ? 'nav-link-active' : ''}`}
            href="/contact"
            prefetch={true}
            onClick={(e) => handleNavClick(e, '/contact')}
          >
            Contact
          </Link>
          {user ? (
            <>
              <Link
                className={`nav-link ${active(path, '/dashboard') ? 'nav-link-active' : ''}`}
                href="/dashboard"
                prefetch={true}
                onClick={(e) => handleNavClick(e, '/dashboard')}
              >
                My trips
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  className={`nav-link nav-admin ${active(path, '/admin') ? 'nav-link-active' : ''}`}
                  href="/admin"
                  prefetch={true}
                  onClick={(e) => handleNavClick(e, '/admin')}
                >
                  Admin
                </Link>
              )}
              <Link
                className={`account-link ${active(path, '/profile') ? 'account-link-active' : ''}`}
                href="/profile"
                prefetch={true}
                onClick={(e) => handleNavClick(e, '/profile')}
                aria-label={`Profile for ${user.name}`}
              >
                <span className="account-avatar">{initials || 'U'}</span>
                <span className="account-name">{user.name?.split(' ')[0]}<small>ACCOUNT</small></span>
              </Link>
              <button className="nav-logout" onClick={logout}>Log out</button>
            </>
          ) : (
            <>
              <Link
                className={`nav-link ${active(path, '/login') ? 'nav-link-active' : ''}`}
                href="/login"
                prefetch={true}
                onClick={(e) => handleNavClick(e, '/login')}
              >
                Log in
              </Link>
              <Link
                className="button button-primary nav-cta"
                href="/register"
                prefetch={true}
                onClick={(e) => handleNavClick(e, '/register')}
              >
                Get started <span aria-hidden="true">↗</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
