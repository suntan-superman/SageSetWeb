import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { APP_STORE_URL } from '../config/storeLinks.js';
import { getVerifiedChallengeShare } from '../services/gamificationSharing.js';
import { trackGamificationValidationEvent } from '../services/gamificationValidationAnalytics.js';
import { flushWorksideEvents } from '../services/worksideAnalytics.js';

export default function VerifiedSquatSharePage() {
  const { shareId = '' } = useParams();
  const [state, setState] = useState({ loading: true, result: null, reason: null });
  const trackedShareId = useRef(null);

  useEffect(() => {
    let active = true;
    void getVerifiedChallengeShare(shareId).then(async (response) => {
      if (!active) return;
      if (response?.available && response.share) {
        setState({ loading: false, result: response.share, reason: null });
        if (trackedShareId.current !== response.share.shareId) {
          trackedShareId.current = response.share.shareId;
          await trackGamificationValidationEvent('friend_challenge_opened', {
            shareId: response.share.shareId,
            challengeId: response.share.challengeId,
            reps: response.share.reps,
            sharingVersion: 'phase5a-v0',
          });
          await flushWorksideEvents();
        }
      } else {
        setState({ loading: false, result: null, reason: response?.reason || 'unavailable' });
      }
    });
    return () => { active = false; };
  }, [shareId]);

  if (state.loading) {
    return <div className="flex min-h-[70vh] items-center justify-center bg-gray-950 text-lg text-emerald-300">Checking SageSet verification…</div>;
  }

  if (!state.result) {
    return (
      <section className="min-h-[70vh] bg-gray-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-xl rounded-3xl border border-gray-700 bg-gray-900 p-8 text-center">
          <div className="text-5xl">⌛</div>
          <h1 className="mt-5 text-3xl font-bold">This invitation is no longer available.</h1>
          <p className="mt-4 text-gray-300">It may have expired, been revoked, or the verified-sharing pilot may be paused.</p>
          <a href="/ar-squats" className="mt-7 inline-flex rounded-xl bg-emerald-500 px-6 py-3 font-bold text-emerald-950">See AR Squats</a>
        </div>
      </section>
    );
  }

  const reps = Number(state.result.reps) || 0;
  return (
    <section className="min-h-[76vh] bg-gray-950 px-5 py-12 text-white sm:py-20">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-emerald-400/40 bg-gradient-to-b from-emerald-950/80 to-gray-900 shadow-2xl shadow-emerald-950/50">
        <div className="p-7 text-center sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/50 bg-emerald-400/15 text-4xl">✓</div>
          <p className="mt-6 text-sm font-extrabold tracking-[0.22em] text-emerald-300">SAGESET VERIFIED</p>
          <h1 className="mt-4 text-5xl font-black leading-none sm:text-7xl">{reps}</h1>
          <p className="mt-3 text-2xl font-bold">verified squat{reps === 1 ? '' : 's'}</p>
          <p className="mt-6 text-xl text-gray-300">Can you match it?</p>
          <div className="mt-8 rounded-2xl border border-gray-700 bg-black/30 p-5 text-left text-sm leading-6 text-gray-300">
            This result was verified from a SageSet AR challenge. The invitation shares only the verified rep count—not the member’s identity, recording, or private workout data.
          </div>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-6 py-4 text-lg font-extrabold text-emerald-950 transition hover:bg-emerald-300"
          >
            Start Your Free 14-Day Trial
          </a>
          <a href="/ar-squats" className="mt-5 inline-block text-sm font-semibold text-emerald-300 hover:text-emerald-200">Learn how AR Squats work →</a>
        </div>
      </div>
    </section>
  );
}
