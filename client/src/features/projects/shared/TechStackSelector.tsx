import React, { useState, useEffect } from 'react';
import { 
  TechStackItem, 
  TechStackCategory,
  TECH_COMPATIBILITY 
} from '@shared/types';
import { Plus, Lock, Unlock, Trash2, AlertTriangle, Check, X } from 'lucide-react';

interface TechStackSelectorProps {
  projectId: string;
  items: TechStackItem[];
  isLocked: boolean;
  userRole: string;
  onAddItem: (item: { category: TechStackCategory; name: string; version?: string }) => Promise<void>;
  onUpdateItem: (id: string, updates: { name?: string; version?: string }) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
  onLock: () => Promise<void>;
  onUnlock: () => Promise<void>;
}

const CATEGORIES: { value: TechStackCategory; label: string }[] = [
  { value: 'LANGUAGE', label: 'Programming Language' },
  { value: 'FRAMEWORK', label: 'Framework' },
  { value: 'DATABASE', label: 'Database' },
  { value: 'HOSTING', label: 'Hosting' },
  { value: 'OTHER', label: 'Other' },
];

const CATEGORY_SUGGESTIONS: Record<TechStackCategory, string[]> = {
  LANGUAGE: ['JavaScript', 'TypeScript', 'Python', 'PHP', 'Java', 'Go', 'Ruby'],
  FRAMEWORK: ['React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Express', 'Laravel', 'Django', 'WordPress'],
  DATABASE: ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite'],
  HOSTING: ['AWS', 'Google Cloud', 'Azure', 'Vercel', 'Netlify', 'DigitalOcean', 'Heroku'],
  OTHER: ['Docker', 'Kubernetes', 'Nginx', 'Apache', 'GraphQL', 'REST API'],
};

export const TechStackSelector: React.FC<TechStackSelectorProps> = ({
  projectId,
  items,
  isLocked,
  userRole,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onLock,
  onUnlock,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<{
    category: TechStackCategory;
    name: string;
    version: string;
  }>({ category: 'FRAMEWORK', name: '', version: '' });
  const [loading, setLoading] = useState(false);
  const [compatibilityWarnings, setCompatibilityWarnings] = useState<string[]>([]);

  const canManage = userRole === 'Manager' || userRole === 'Admin';


  // Check compatibility when selecting a new item
  useEffect(() => {
    if (!newItem.name) {
      setCompatibilityWarnings([]);
      return;
    }

    const compatibleTechs = TECH_COMPATIBILITY[newItem.name] || [];
    const warnings: string[] = [];

    if (compatibleTechs.length > 0) {
      items.forEach(item => {
        if (item.category !== newItem.category) {
          if (!compatibleTechs.includes(item.name)) {
            const itemCompatible = TECH_COMPATIBILITY[item.name] || [];
            if (itemCompatible.length > 0 && !itemCompatible.includes(newItem.name)) {
              warnings.push(`${newItem.name} may not be compatible with ${item.name}`);
            }
          }
        }
      });
    }

    setCompatibilityWarnings(warnings);
  }, [newItem.name, newItem.category, items]);

  const handleAddItem = async () => {
    if (!newItem.name.trim()) return;
    
    setLoading(true);
    try {
      await onAddItem({
        category: newItem.category,
        name: newItem.name.trim(),
        version: newItem.version.trim() || undefined,
      });
      setNewItem({ category: 'FRAMEWORK', name: '', version: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add tech stack item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this item?')) return;
    
    setLoading(true);
    try {
      await onDeleteItem(id);
    } catch (error) {
      console.error('Failed to delete tech stack item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLockToggle = async () => {
    setLoading(true);
    try {
      if (isLocked) {
        await onUnlock();
      } else {
        await onLock();
      }
    } catch (error) {
      console.error('Failed to toggle lock:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = items.filter(item => item.category === cat.value);
    return acc;
  }, {} as Record<TechStackCategory, TechStackItem[]>);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Tech Stack</h3>
          {isLocked && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
              <Lock className="w-3 h-3" />
              Locked
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={handleLockToggle}
              disabled={loading || items.length === 0}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                isLocked
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isLocked ? 'Unlock' : 'Lock'}
            </button>
          )}
          
          {!isLocked && (
            <button
              onClick={() => setShowAddForm(true)}
              disabled={loading}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Add Technology
            </button>
          )}
        </div>
      </div>


      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Technology</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value as TechStackCategory, name: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technology
              </label>
              <input
                type="text"
                list={`suggestions-${newItem.category}`}
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="e.g., React, Node.js"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <datalist id={`suggestions-${newItem.category}`}>
                {CATEGORY_SUGGESTIONS[newItem.category].map(tech => (
                  <option key={tech} value={tech} />
                ))}
              </datalist>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Version (optional)
              </label>
              <input
                type="text"
                value={newItem.version}
                onChange={(e) => setNewItem({ ...newItem, version: e.target.value })}
                placeholder="e.g., 18.2.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          {compatibilityWarnings.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Compatibility Warning</p>
                  <ul className="mt-1 text-sm text-amber-700">
                    {compatibilityWarnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewItem({ category: 'FRAMEWORK', name: '', version: '' });
              }}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              disabled={loading || !newItem.name.trim()}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}


      {/* Tech Stack List */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No technologies added yet.</p>
          <p className="text-sm mt-1">Click "Add Technology" to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map(cat => {
            const categoryItems = groupedItems[cat.value];
            if (categoryItems.length === 0) return null;
            
            return (
              <div key={cat.value}>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  {cat.label}
                </h4>
                <div className="space-y-2">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {item.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.version && (
                            <p className="text-sm text-gray-500">v{item.version}</p>
                          )}
                        </div>
                        {item.isLocked && (
                          <Lock className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      
                      {!isLocked && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={loading}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lock Info */}
      {isLocked && items.length > 0 && items[0].lockedAt && (
        <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">
            <Lock className="w-4 h-4 inline mr-1" />
            Tech stack was locked on{' '}
            <span className="font-medium">
              {new Date(items[0].lockedAt).toLocaleDateString()}
            </span>
            {items[0].lockedBy && (
              <span> by a Manager</span>
            )}
          </p>
          {canManage && (
            <p className="text-sm text-gray-500 mt-1">
              As a {userRole}, you can unlock the tech stack to make changes.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TechStackSelector;
