import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import {
  BugAntIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ChatBubbleLeftEllipsisIcon,
  PlusIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import AdminHeader from '../components/AdminHeader.jsx';

const STATUS_CONFIG = {
  new: { 
    label: 'New', 
    color: 'bg-blue-500', 
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500'
  },
  'in-progress': { 
    label: 'In Progress', 
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-500'
  },
  addressed: { 
    label: 'Addressed', 
    color: 'bg-emerald-500', 
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-900/30',
    borderColor: 'border-emerald-500'
  },
  closed: { 
    label: 'Closed', 
    color: 'bg-gray-500', 
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-900/30',
    borderColor: 'border-gray-500'
  },
};

const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'text-red-400', bgColor: 'bg-red-900/30' },
  medium: { label: 'Medium', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' },
  low: { label: 'Low', color: 'text-gray-400', bgColor: 'bg-gray-900/30' },
};

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [filter, setFilter] = useState('all'); // all, bug, feature
  const [statusFilter, setStatusFilter] = useState('open'); // open, all, addressed, closed

  useEffect(() => {
    // Subscribe to feedback collection
    const feedbackRef = collection(db, 'feedback');
    const q = query(feedbackRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
      setFeedback(items);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching feedback:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const updateStatus = async (itemId, newStatus) => {
    try {
      const docRef = doc(db, 'feedback', itemId);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updatePriority = async (itemId, newPriority) => {
    try {
      const docRef = doc(db, 'feedback', itemId);
      await updateDoc(docRef, {
        priority: newPriority,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const addNote = async (itemId) => {
    if (!newNote.trim()) return;

    try {
      const docRef = doc(db, 'feedback', itemId);
      await updateDoc(docRef, {
        notes: arrayUnion({
          text: newNote.trim(),
          addedBy: user.email,
          addedAt: new Date().toISOString(),
        }),
        updatedAt: Timestamp.now(),
      });
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const filteredFeedback = feedback.filter((item) => {
    // Type filter
    if (filter !== 'all' && item.type !== filter) return false;
    
    // Status filter
    if (statusFilter === 'open' && (item.status === 'addressed' || item.status === 'closed')) return false;
    if (statusFilter === 'addressed' && item.status !== 'addressed') return false;
    if (statusFilter === 'closed' && item.status !== 'closed') return false;
    
    return true;
  });

  const stats = {
    total: feedback.length,
    bugs: feedback.filter((f) => f.type === 'bug').length,
    features: feedback.filter((f) => f.type === 'feature').length,
    open: feedback.filter((f) => f.status !== 'addressed' && f.status !== 'closed').length,
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <div className="text-gray-400 text-sm">Total Feedback</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-3xl font-bold text-red-400">{stats.bugs}</div>
            <div className="text-gray-400 text-sm">Bug Reports</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-3xl font-bold text-amber-400">{stats.features}</div>
            <div className="text-gray-400 text-sm">Feature Requests</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="text-3xl font-bold text-blue-400">{stats.open}</div>
            <div className="text-gray-400 text-sm">Open Items</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-gray-400 text-sm">Type:</span>
            <div className="flex gap-2">
              {['all', 'bug', 'feature'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'bug' ? '🐛 Bugs' : '💡 Features'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Status:</span>
            <div className="flex gap-2">
              {['open', 'all', 'addressed', 'closed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    statusFilter === s
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedback.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
              <ChatBubbleLeftEllipsisIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No feedback items found.</p>
            </div>
          ) : (
            filteredFeedback.map((item) => (
              <div
                key={item.id}
                className={`bg-gray-800 rounded-xl border-l-4 ${
                  item.type === 'bug' ? 'border-l-red-500' : 'border-l-amber-500'
                } border border-gray-700 overflow-hidden`}
              >
                {/* Main Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        item.type === 'bug' ? 'bg-red-900/30' : 'bg-amber-900/30'
                      }`}>
                        {item.type === 'bug' ? (
                          <BugAntIcon className="h-6 w-6 text-red-400" />
                        ) : (
                          <LightBulbIcon className="h-6 w-6 text-amber-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            STATUS_CONFIG[item.status]?.bgColor
                          } ${STATUS_CONFIG[item.status]?.textColor}`}>
                            {STATUS_CONFIG[item.status]?.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            PRIORITY_CONFIG[item.priority]?.bgColor
                          } ${PRIORITY_CONFIG[item.priority]?.color}`}>
                            {PRIORITY_CONFIG[item.priority]?.label}
                          </span>
                        </div>
                        <p className="text-white whitespace-pre-wrap">{item.message}</p>
                        <div className="mt-2 text-sm text-gray-400">
                          <span>{item.userName} ({item.userEmail})</span>
                          <span className="mx-2">•</span>
                          <span>{item.createdAt?.toLocaleDateString()} {item.createdAt?.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {selectedItem?.id === item.id ? (
                        <XMarkIcon className="h-6 w-6" />
                      ) : (
                        <ChatBubbleLeftEllipsisIcon className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Actions */}
                {selectedItem?.id === item.id && (
                  <div className="border-t border-gray-700 p-4 bg-gray-800/50">
                    {/* Status & Priority Controls */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div>
                        <label className="text-gray-400 text-sm block mb-2">Status</label>
                        <div className="flex gap-2">
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <button
                              key={key}
                              onClick={() => updateStatus(item.id, key)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                item.status === key
                                  ? `${config.bgColor} ${config.textColor} border ${config.borderColor}`
                                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                              }`}
                            >
                              {config.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-gray-400 text-sm block mb-2">Priority</label>
                        <div className="flex gap-2">
                          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                            <button
                              key={key}
                              onClick={() => updatePriority(item.id, key)}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                item.priority === key
                                  ? `${config.bgColor} ${config.color} border border-current`
                                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                              }`}
                            >
                              {config.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-gray-400 text-sm block mb-2">
                        Notes ({item.notes?.length || 0})
                      </label>
                      
                      {/* Existing Notes */}
                      {item.notes?.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {item.notes.map((note, idx) => (
                            <div key={idx} className="bg-gray-700/50 rounded-lg p-3">
                              <p className="text-gray-200 text-sm">{note.text}</p>
                              <p className="text-gray-500 text-xs mt-1">
                                {note.addedBy} • {new Date(note.addedAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Note */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add a note..."
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          onKeyPress={(e) => e.key === 'Enter' && addNote(item.id)}
                        />
                        <button
                          onClick={() => addNote(item.id)}
                          disabled={!newNote.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <PlusIcon className="h-5 w-5" />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
