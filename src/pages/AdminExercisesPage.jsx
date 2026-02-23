import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../config/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  getDocs,
  where,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CloudArrowUpIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import AdminHeader from '../components/AdminHeader.jsx';
import seedCatalog from '../data/exerciseCatalogSeed.json';

const SEED_CATALOG = Array.isArray(seedCatalog) ? seedCatalog : [];

const buildSeedOptions = (key) => {
  const values = SEED_CATALOG.map((item) => String(item?.[key] || '').trim()).filter(Boolean);
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
};

const SEED_PRIMARY_MUSCLES = buildSeedOptions('primaryMuscle');
const SEED_DIFFICULTY = buildSeedOptions('difficulty');
const SEED_MOVEMENT_PATTERNS = buildSeedOptions('movementPattern');

const emptyForm = {
  id: '',
  name: '',
  videoUrl: '',
  videoPosterUrl: '',
  aliases: '',
  equipment: '',
  primaryMuscle: '',
  difficulty: '',
  movementPattern: '',
  aiTags: '',
  isUnilateral: false,
  isCompound: false,
};

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const parseList = (value) =>
  String(value || '')
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return parseList(value);
};

const normalizeName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const getFileExtension = (file) => {
  if (!file?.name) return '';
  const parts = file.name.split('.');
  if (parts.length < 2) return '';
  return `.${parts.pop().toLowerCase()}`;
};

const buildStoragePath = (exerciseId, kind, file) => {
  const ext = getFileExtension(file) || '';
  return `exercise-media/${exerciseId}/${kind}${ext}`;
};

const buildUniqueId = (base, existingIds) => {
  let id = base || 'exercise';
  let counter = 2;
  while (existingIds.has(id)) {
    id = `${base}_${counter}`;
    counter += 1;
  }
  return id;
};

export default function AdminExercisesPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [mode, setMode] = useState('create');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoPoster, setAutoPoster] = useState(true);
  const [storageCheck, setStorageCheck] = useState({ status: 'idle', message: '' });
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [toast, setToast] = useState({ visible: false, text: '', type: 'success' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const catalogRef = collection(db, 'exerciseCatalog');
    const q = query(catalogRef, orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setCatalog(items);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching exercise catalog:', err);
        setError('Failed to load exercise catalog.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (importing || uploading) {
      document.body.style.cursor = 'progress';
    } else {
      document.body.style.cursor = '';
    }
    return () => {
      document.body.style.cursor = '';
    };
  }, [importing, uploading]);

  useEffect(() => {
    if (!toast.visible) return undefined;
    const timer = setTimeout(() => {
      setToast({ visible: false, text: '', type: 'success' });
    }, 1800);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const resetForm = () => {
    setForm(emptyForm);
    setMode('create');
    setError('');
    setMessage('');
  };

  const existingIds = useMemo(() => new Set(catalog.map((item) => item.id)), [catalog]);
  const existingNames = useMemo(
    () =>
      new Map(
        catalog.map((item) => [normalizeName(item.name), item.id]).filter(([key]) => key)
      ),
    [catalog]
  );

  const isDuplicateName = (name, currentId = '') => {
    const key = normalizeName(name);
    if (!key) return false;
    const existingId = existingNames.get(key);
    return !!existingId && existingId !== currentId;
  };

  const isValidName = (name) => String(name || '').trim().length > 3;
  const isValidPrimaryMuscle = (value) => String(value || '').trim().length > 0;
  const nameIsDuplicate = isDuplicateName(form.name, mode === 'edit' ? form.id : '');

  const primaryMuscleOptions = useMemo(() => {
    const baseList = SEED_PRIMARY_MUSCLES.length > 0 ? SEED_PRIMARY_MUSCLES : [];
    const baseSet = new Set(baseList);
    const extras = [];
    catalog.forEach((item) => {
      const value = String(item.primaryMuscle || '').trim();
      if (value && !baseSet.has(value)) extras.push(value);
    });
    extras.sort((a, b) => a.localeCompare(b));
    return [...baseList, ...extras];
  }, [catalog]);

  const difficultyOptions = useMemo(() => {
    const baseList = SEED_DIFFICULTY.length > 0 ? SEED_DIFFICULTY : [];
    const baseSet = new Set(baseList);
    const extras = [];
    catalog.forEach((item) => {
      const value = String(item.difficulty || '').trim();
      if (value && !baseSet.has(value)) extras.push(value);
    });
    extras.sort((a, b) => a.localeCompare(b));
    return [...baseList, ...extras];
  }, [catalog]);

  const movementPatternOptions = useMemo(() => {
    const baseList = SEED_MOVEMENT_PATTERNS.length > 0 ? SEED_MOVEMENT_PATTERNS : [];
    const baseSet = new Set(baseList);
    const extras = [];
    catalog.forEach((item) => {
      const value = String(item.movementPattern || '').trim();
      if (value && !baseSet.has(value)) extras.push(value);
    });
    extras.sort((a, b) => a.localeCompare(b));
    return [...baseList, ...extras];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return catalog;
    return catalog.filter((item) => {
      const name = String(item.name || '').toLowerCase();
      const id = String(item.id || '').toLowerCase();
      const aliases = Array.isArray(item.aliases)
        ? item.aliases.join(' ').toLowerCase()
        : '';
      return name.includes(term) || id.includes(term) || aliases.includes(term);
    });
  }, [catalog, filter]);

  const applyEdit = (item) => {
    setForm({
      id: item.id || '',
      name: item.name || '',
      videoUrl: item.videoUrl || '',
      videoPosterUrl: item.videoPosterUrl || '',
      aliases: Array.isArray(item.aliases) ? item.aliases.join(', ') : '',
      equipment: Array.isArray(item.equipment) ? item.equipment.join(', ') : item.equipment || '',
      primaryMuscle: item.primaryMuscle || '',
      difficulty: item.difficulty || '',
      movementPattern: item.movementPattern || '',
      aiTags: Array.isArray(item.aiTags) ? item.aiTags.join(', ') : item.aiTags || '',
      isUnilateral: !!item.isUnilateral,
      isCompound: !!item.isCompound,
    });
    setMode('edit');
    setError('');
    setMessage('');
  };

  const handleSave = async () => {
    setError('');
    setMessage('');

    const name = form.name.trim();
    const primaryMuscle = form.primaryMuscle.trim();

    if (!isValidName(name)) {
      setError('Exercise name must be at least 4 characters.');
      return;
    }
    if (!isValidPrimaryMuscle(primaryMuscle)) {
      setError('Primary muscle is required.');
      return;
    }
    if (isDuplicateName(name, mode === 'edit' ? form.id : '')) {
      setError('Exercise name already exists. Use a unique name.');
      return;
    }

    const aliases = parseList(form.aliases);
    const equipment = parseList(form.equipment);
    const aiTags = parseList(form.aiTags);
    const difficulty = form.difficulty.trim();
    const movementPattern = form.movementPattern.trim();

    try {
      setBusy(true);
      const nameQuery = query(
        collection(db, 'exerciseCatalog'),
        where('name', '==', name)
      );
      const nameSnapshot = await getDocs(nameQuery);
      const duplicateDoc = nameSnapshot.docs.find((docSnap) => docSnap.id !== form.id);
      if (duplicateDoc) {
        setError('Exercise name already exists in the catalog.');
        setBusy(false);
        return;
      }

      if (mode === 'edit') {
        const docRef = doc(db, 'exerciseCatalog', form.id);
        await updateDoc(docRef, {
          name,
          videoUrl: form.videoUrl.trim() || null,
          videoPosterUrl: form.videoPosterUrl.trim() || null,
          aliases,
          equipment,
          primaryMuscle: primaryMuscle || null,
          difficulty: difficulty || null,
          movementPattern: movementPattern || null,
          aiTags,
          isUnilateral: !!form.isUnilateral,
          isCompound: !!form.isCompound,
          updatedAt: serverTimestamp(),
        });
        setMessage('Exercise updated.');
      } else {
        const baseId = form.id.trim() || slugify(name);
        const id = buildUniqueId(baseId, existingIds);

        if (existingIds.has(id)) {
          setError('Exercise ID already exists.');
          return;
        }

        const docRef = doc(db, 'exerciseCatalog', id);
        await setDoc(docRef, {
          name,
          videoUrl: form.videoUrl.trim() || null,
          videoPosterUrl: form.videoPosterUrl.trim() || null,
          aliases,
          equipment,
          primaryMuscle: primaryMuscle || null,
          difficulty: difficulty || null,
          movementPattern: movementPattern || null,
          aiTags,
          isUnilateral: !!form.isUnilateral,
          isCompound: !!form.isCompound,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setMessage('Exercise created.');
        setForm(emptyForm);
      }
    } catch (err) {
      console.error('Error saving exercise:', err);
      setError('Failed to save exercise.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (kind, file, options = {}) => {
    if (!file) return;
    if (mode !== 'edit' || !form.id) {
      setError('Save the exercise before uploading media.');
      return { success: false };
    }

    setError('');
    setMessage('');
    setUploading(true);

    try {
      const extension = options.overrideExt || getFileExtension(file) || (kind === 'poster' ? '.jpg' : '');
      const path = buildStoragePath(form.id, kind, { name: `file${extension}` });
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, {
        contentType: options.contentType || file.type || undefined,
      });
      const url = await getDownloadURL(storageRef);

      const updates = {
        updatedAt: serverTimestamp(),
      };

      if (kind === 'video') {
        updates.videoUrl = url;
        setForm((prev) => ({ ...prev, videoUrl: url }));
      } else {
        updates.videoPosterUrl = url;
        setForm((prev) => ({ ...prev, videoPosterUrl: url }));
      }

      await updateDoc(doc(db, 'exerciseCatalog', form.id), updates);
      setMessage(`${kind === 'video' ? 'Video' : 'Poster'} uploaded.`);
      if (kind === 'video') {
        setToast({ visible: true, text: 'Video saved', type: 'success' });
      }
      return { success: true, url };
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload file.');
      return { success: false };
    } finally {
      setUploading(false);
    }
  };

  const generatePosterFromVideo = (file) =>
    new Promise((resolve, reject) => {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        const objectUrl = URL.createObjectURL(file);
        video.src = objectUrl;

        const cleanup = () => {
          URL.revokeObjectURL(objectUrl);
        };

        video.onloadedmetadata = () => {
          const targetTime = Math.min(1, Math.max(0.1, video.duration / 2));
          video.currentTime = targetTime;
        };

        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            cleanup();
            reject(new Error('Canvas not supported'));
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              cleanup();
              if (blob) resolve(blob);
              else reject(new Error('Failed to generate poster'));
            },
            'image/jpeg',
            0.82
          );
        };

        video.onerror = () => {
          cleanup();
          reject(new Error('Failed to load video'));
        };
      } catch (err) {
        reject(err);
      }
    });

  const handleVideoUpload = async (file) => {
    if (!file) return;
    const videoResult = await handleUpload('video', file);
    if (!videoResult?.success || !autoPoster) return;

    try {
      setUploading(true);
      const posterBlob = await generatePosterFromVideo(file);
      await handleUpload('poster', posterBlob, { overrideExt: '.jpg', contentType: 'image/jpeg' });
    } catch (err) {
      console.error('Poster generation failed:', err);
      setError('Video uploaded, but poster generation failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setError('');
    setMessage('');
    try {
      setBusy(true);
      await deleteDoc(doc(db, 'exerciseCatalog', item.id));
      if (mode === 'edit' && form.id === item.id) {
        resetForm();
      }
      setMessage('Exercise deleted.');
    } catch (err) {
      console.error('Error deleting exercise:', err);
      setError('Failed to delete exercise.');
    } finally {
      setBusy(false);
    }
  };

  const runStorageHealthCheck = async () => {
    setStorageCheck({ status: 'running', message: 'Checking storage access...' });
    setError('');
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const path = `exercise-media/_healthcheck/admin-${stamp}.txt`;
      const storageRef = ref(storage, path);
      const payload = new Blob([`healthcheck ${new Date().toISOString()}`], {
        type: 'text/plain',
      });

      await uploadBytes(storageRef, payload, { contentType: 'text/plain' });
      await getDownloadURL(storageRef);
      await deleteObject(storageRef);

      setStorageCheck({
        status: 'success',
        message: `Storage OK (path: ${path})`,
      });
    } catch (err) {
      console.error('Storage health check failed:', err);
      setStorageCheck({
        status: 'error',
        message: err?.message || 'Storage check failed.',
      });
    }
  };

  const handleSeed = async () => {
    setError('');
    setMessage('');
    try {
      setBusy(true);
      const batch = writeBatch(db);
      const ids = new Set(existingIds);
      let created = 0;

      SEED_CATALOG.forEach((item) => {
        const name = String(item?.name || '').trim();
        if (!name) return;
        const baseId = slugify(name);
        if (!baseId) return;
        const id = buildUniqueId(baseId, ids);
        if (ids.has(id)) return;
        ids.add(id);
        const docRef = doc(db, 'exerciseCatalog', id);
        batch.set(docRef, {
          name,
          videoUrl: null,
          videoPosterUrl: null,
          aliases: normalizeArray(item?.aliases),
          equipment: normalizeArray(item?.equipment),
          primaryMuscle: String(item?.primaryMuscle || '').trim() || null,
          difficulty: String(item?.difficulty || '').trim() || null,
          movementPattern: String(item?.movementPattern || '').trim() || null,
          aiTags: normalizeArray(item?.aiTags),
          isUnilateral: !!item?.isUnilateral,
          isCompound: !!item?.isCompound,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        created += 1;
      });

      if (created === 0) {
        setMessage('Seed list already exists in the catalog.');
        return;
      }

      await batch.commit();
      setMessage(`Seeded ${created} exercises.`);
    } catch (err) {
      console.error('Error seeding exercises:', err);
      setError('Failed to seed exercises.');
    } finally {
      setBusy(false);
    }
  };

  const handleImportFile = async (file) => {
    if (!file) return;
    setError('');
    setMessage('');
    setImporting(true);
    setImportProgress(0);
    setImportStatus('Reading JSON...');

    try {
      const raw = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseError) {
        setError(`Import failed: ${parseError?.message || 'Invalid JSON.'}`);
        setImporting(false);
        return;
      }
      if (!Array.isArray(parsed)) {
        setError('Import failed: JSON must be an array of exercises.');
        setImporting(false);
        return;
      }

      const ids = new Set(existingIds);
      const nameMap = new Map(existingNames);
      let created = 0;
      let updated = 0;
      let skipped = 0;
      let processed = 0;
      const total = parsed.length;

      const batch = writeBatch(db);

      setImportProgress(10);
      setImportStatus('Preparing records...');

      for (const item of parsed) {
        const name = String(item?.name || '').trim();
        if (!name) {
          skipped += 1;
          processed += 1;
          continue;
        }

        const normalized = normalizeName(name);
        const existingId = nameMap.get(normalized);
        let id = existingId;
        const primaryMuscle = String(item?.primaryMuscle || '').trim();
        const isNew = !existingId;

        if (!id) {
          const baseId = slugify(name);
          id = buildUniqueId(baseId, ids);
          ids.add(id);
          nameMap.set(normalized, id);
          created += 1;
        } else {
          updated += 1;
        }

        const docRef = doc(db, 'exerciseCatalog', id);
        batch.set(
          docRef,
          {
            name,
            primaryMuscle: primaryMuscle || null,
            difficulty: String(item?.difficulty || '').trim() || null,
            equipment: normalizeArray(item?.equipment),
            movementPattern: String(item?.movementPattern || '').trim() || null,
            aiTags: normalizeArray(item?.aiTags),
            isUnilateral: !!item?.isUnilateral,
            isCompound: !!item?.isCompound,
            updatedAt: serverTimestamp(),
            ...(isNew && !existingIds.has(id) ? { createdAt: serverTimestamp() } : {}),
          },
          { merge: true }
        );
        processed += 1;
        if (processed % 5 === 0 || processed === total) {
          const pct = 10 + Math.round((processed / Math.max(total, 1)) * 60);
          setImportProgress(Math.min(70, pct));
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      setImportStatus('Writing to Firestore...');
      setImportProgress(85);
      await batch.commit();
      setImportProgress(100);
      setImportStatus('Complete');
      setMessage(`Import complete: ${created} created, ${updated} updated, ${skipped} skipped.`);
    } catch (err) {
      console.error('Import failed:', err);
      setError(`Import failed: ${err?.message || 'Unknown error.'}`);
    } finally {
      setImporting(false);
      setTimeout(() => {
        setImportProgress(0);
        setImportStatus('');
      }, 1200);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-emerald-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminHeader userEmail={user?.email} onLogout={handleLogout} />

      {toast.visible && (
        <div className="fixed top-24 right-6 z-50">
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
            {toast.text}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-sm text-gray-400">Storage Bucket</div>
            <div className="text-white font-medium">
              {storage?.app?.options?.storageBucket || 'Unknown bucket'}
            </div>
            {storageCheck.status !== 'idle' && (
              <div
                className={`mt-2 text-sm ${
                  storageCheck.status === 'success'
                    ? 'text-emerald-300'
                    : storageCheck.status === 'error'
                      ? 'text-red-300'
                      : 'text-gray-400'
                }`}
              >
                {storageCheck.message}
              </div>
            )}
          </div>
          <button
            onClick={runStorageHealthCheck}
            disabled={storageCheck.status === 'running' || uploading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            <CloudArrowUpIcon className="h-5 w-5" />
            {storageCheck.status === 'running' ? 'Checking...' : 'Run Storage Check'}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search exercises..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={handleSeed}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
              >
                <CloudArrowUpIcon className="h-5 w-5" />
                Seed Initial List
              </button>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg cursor-pointer transition-colors">
                <ArrowUpTrayIcon className="h-5 w-5" />
                {importing ? 'Importing...' : 'Import JSON'}
                <input
                  type="file"
                  accept="application/json"
                  onChange={(e) => handleImportFile(e.target.files?.[0])}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>

            {message && (
              <div className="bg-emerald-900/40 border border-emerald-700 text-emerald-200 rounded-lg px-4 py-3">
                {message}
              </div>
            )}
            {error && (
              <div className="bg-red-900/40 border border-red-700 text-red-200 rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            {importing && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
                <div className="text-sm text-gray-300 mb-2">
                  {importStatus || 'Importing exercises...'} {importProgress ? `${importProgress}%` : ''}
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-emerald-500 transition-all"
                    style={{ width: `${importProgress || 8}%` }}
                  />
                </div>
              </div>
            )}

            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 text-sm text-gray-400">
                {filteredCatalog.length} exercises
              </div>
              <div className="divide-y divide-gray-700">
                {filteredCatalog.length === 0 ? (
                  <div className="px-4 py-6 text-gray-400">
                    No exercises match your search.
                  </div>
                ) : (
                  filteredCatalog.map((item) => (
                    <div key={item.id} className="px-4 py-4 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-white font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: <span className="text-gray-400">{item.id}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Video: {item.videoUrl ? 'Attached' : 'Missing'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => applyEdit(item)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 text-sm"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-red-900/40 text-red-200 hover:bg-red-900 text-sm"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-96">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 lg:sticky lg:top-24 self-start">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  {mode === 'edit' ? 'Edit Exercise' : 'Add Exercise'}
                </h2>
                {mode === 'edit' && (
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-white"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Exercise name"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 4 characters.</p>
                  {nameIsDuplicate && (
                    <p className="text-xs text-red-400 mt-1">Name already exists.</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Exercise ID</label>
                  <input
                    type="text"
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    className={`w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      mode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                    placeholder="Auto-generated if blank"
                    disabled={mode === 'edit'}
                  />
                  {mode === 'create' && form.name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Suggested ID: {buildUniqueId(slugify(form.name), existingIds)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Primary Muscle *</label>
                  <select
                    value={form.primaryMuscle}
                    onChange={(e) => setForm({ ...form, primaryMuscle: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select a muscle</option>
                    {primaryMuscleOptions.map((muscle) => (
                      <option key={muscle} value={muscle}>
                        {muscle}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Difficulty</label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select difficulty</option>
                    {difficultyOptions.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Movement Pattern</label>
                  <select
                    value={form.movementPattern}
                    onChange={(e) => setForm({ ...form, movementPattern: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select pattern</option>
                    {movementPatternOptions.map((pattern) => (
                      <option key={pattern} value={pattern}>
                        {pattern}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Video URL</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={form.videoUrl}
                      onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="https://..."
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-gray-400">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                        disabled={uploading || mode !== 'edit'}
                        className="text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-700 file:px-3 file:py-1 file:text-sm file:text-gray-200 hover:file:bg-gray-600"
                      />
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-gray-400">
                      <input
                        type="checkbox"
                        checked={autoPoster}
                        onChange={(e) => setAutoPoster(e.target.checked)}
                        disabled={uploading}
                        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      Auto-generate poster from video
                    </label>
                    {mode !== 'edit' && (
                      <p className="text-xs text-gray-500">Save the exercise to enable uploads.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Poster URL</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={form.videoPosterUrl}
                      onChange={(e) => setForm({ ...form, videoPosterUrl: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="https://..."
                    />
                    <label className="inline-flex items-center gap-2 text-sm text-gray-400">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUpload('poster', e.target.files?.[0])}
                        disabled={uploading || mode !== 'edit'}
                        className="text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-700 file:px-3 file:py-1 file:text-sm file:text-gray-200 hover:file:bg-gray-600"
                      />
                    </label>
                    {mode !== 'edit' && (
                      <p className="text-xs text-gray-500">Save the exercise to enable uploads.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Aliases</label>
                  <input
                    type="text"
                    value={form.aliases}
                    onChange={(e) => setForm({ ...form, aliases: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="push ups, standard pushup"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Equipment</label>
                  <input
                    type="text"
                    value={form.equipment}
                    onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="dumbbells, bench"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">AI Tags</label>
                  <input
                    type="text"
                    value={form.aiTags}
                    onChange={(e) => setForm({ ...form, aiTags: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="upper_body, push, triceps"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.isUnilateral}
                      onChange={(e) => setForm({ ...form, isUnilateral: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    Unilateral
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.isCompound}
                      onChange={(e) => setForm({ ...form, isCompound: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    Compound
                  </label>
                </div>

                <button
                  onClick={handleSave}
                  disabled={
                    busy ||
                    !isValidName(form.name) ||
                    !isValidPrimaryMuscle(form.primaryMuscle) ||
                    nameIsDuplicate
                  }
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  {mode === 'edit' ? 'Save Changes' : 'Add Exercise'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
