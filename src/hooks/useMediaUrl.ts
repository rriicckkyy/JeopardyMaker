import { useEffect, useState } from 'react';
import { loadMedia } from '../lib/db';

/** Loads a media blob from IndexedDB and exposes it as an object URL, revoking it on cleanup. */
export function useMediaUrl(mediaId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    if (!mediaId) {
      setUrl(null);
      return;
    }

    loadMedia(mediaId).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mediaId]);

  return url;
}
