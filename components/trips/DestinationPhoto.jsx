'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';

const photoCache = new Map();

export default function DestinationPhoto({ destination, className = '', hideCaption = false, altText = '', priority = false }) {
  const query = typeof destination === 'string' ? destination.trim() : '';
  const [photo, setPhoto] = useState(() => photoCache.get(query.toLowerCase()) || null);
  const [status, setStatus] = useState(query.length >= 2 ? 'loading' : 'idle');

  useEffect(() => {
    const normalized = query.toLowerCase();
    if (query.length < 2 || normalized === 'surprise me') {
      setPhoto(null);
      setStatus('idle');
      return undefined;
    }

    const cached = photoCache.get(normalized);
    if (cached) {
      setPhoto(cached);
      setStatus('ready');
      return undefined;
    }

    const controller = new AbortController();
    setStatus('loading');
    const timer = setTimeout(async () => {
      try {
        const response = await api.get('/images/search', { params: { query }, signal: controller.signal });
        const result = response.data?.data?.image;
        if (result?.url) {
          photoCache.set(normalized, result);
          setPhoto(result);
          setStatus('ready');
        } else {
          setStatus('empty');
        }
      } catch (error) {
        if (error.name !== 'CanceledError' && error.name !== 'AbortError') setStatus('unavailable');
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (!query || query.toLowerCase() === 'surprise me') return null;

  return (
    <figure className={`destination-photo ${className}`} aria-busy={status === 'loading'}>
      {photo ? (
        <Image
          src={photo.url}
          alt={altText || photo.alt || `Travel destination: ${query}`}
          fill
          sizes="(max-width: 700px) 100vw, 50vw"
          loading={priority ? 'eager' : 'lazy'}
          unoptimized
        />
      ) : (
        <div className="destination-photo-placeholder">
          <span aria-hidden="true">{status === 'loading' ? '⏳' : '📍'}</span>
          <strong>{query}</strong>
          <small>{status === 'loading' ? 'Loading travel scenery…' : 'Destination scenery'}</small>
        </div>
      )}
      {photo && !hideCaption && (
        <figcaption>
          Photo by{' '}
          <a href={photo.photographerUrl} target="_blank" rel="noreferrer">
            {photo.photographer}
          </a>{' '}
          on{' '}
          <a href={photo.photoUrl} target="_blank" rel="noreferrer">
            {photo.source || 'Unsplash'}
          </a>
        </figcaption>
      )}
    </figure>
  );
}
