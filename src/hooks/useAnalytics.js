// ─── src/hooks/useAnalytics.js ────────────────────────────────────────────────
// Writes a presence document to Firestore every time a user visits a page.
// The admin dashboard reads the `analytics/visitors` doc to get total counts.
//
// Firestore structure:
//   analytics/visitors  → { totalVisits: number, uniqueUsers: string[] }
//   analytics/pageviews → { [page]: number }

import { useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Call this once in AppContext or App.js to track every page transition.
 * @param {string} page   - current page name (e.g. 'home', 'search')
 * @param {object} user   - current user object (null if anonymous)
 */
export function useAnalytics(page, user) {
  useEffect(() => {
    const track = async () => {
      try {
        const visitorRef  = doc(db, 'analytics', 'visitors');
        const pageviewRef = doc(db, 'analytics', 'pageviews');

        // Increment total visit counter
        const snap = await getDoc(visitorRef);
        if (!snap.exists()) {
          // First ever document — initialise
          await setDoc(visitorRef, {
            totalVisits:  1,
            uniqueUsers:  user ? [user.uid] : [],
            lastVisit:    new Date().toISOString(),
          });
        } else {
          await updateDoc(visitorRef, {
            totalVisits: increment(1),
            lastVisit:   new Date().toISOString(),
            // Add uid to uniqueUsers set (arrayUnion ignores duplicates)
            ...(user?.uid ? { uniqueUsers: arrayUnion(user.uid) } : {}),
          });
        }

        // Increment per-page counter
        const pvSnap = await getDoc(pageviewRef);
        if (!pvSnap.exists()) {
          await setDoc(pageviewRef, { [page]: 1 });
        } else {
          await updateDoc(pageviewRef, { [page]: increment(1) });
        }
      } catch {
        // Silently fail — analytics should never break the app
      }
    };

    track();
  }, [page]); // re-runs on every page change
}
