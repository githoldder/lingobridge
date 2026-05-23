import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Plus, Users, Trash2 } from 'lucide-react';
// Use existing api client setup. We'll add classesApi next.
import { apiFetch } from '../services/apiClient.ts';

export const classesApi = {
  list: async () => apiFetch<any[]>('/classes'),
  create: async (name: string, description?: string) => apiFetch<any>('/classes', { method: 'POST', body: JSON.stringify({ name, description }) }),
  delete: async (id: string) => apiFetch<any>(`/classes/${id}`, { method: 'DELETE' }),
  getMembers: async (id: string) => apiFetch<any[]>(`/classes/${id}/members`),
  addMember: async (id: string, studentId: string) => apiFetch<any>(`/classes/${id}/members`, { method: 'POST', body: JSON.stringify({ studentId }) }),
  removeMember: async (id: string, studentId: string) => apiFetch<any>(`/classes/${id}/members/${studentId}`, { method: 'DELETE' })
};

const TeacherClassesView = () => {
  const { t } = useLanguage();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newClassName, setNewClassName] = useState('');
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [newStudentId, setNewStudentId] = useState('');

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await classesApi.list();
      setClasses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClasses(); }, []);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    try {
      const created = await classesApi.create(newClassName);
      setClasses([created, ...classes]);
      setNewClassName('');
    } catch (e) { console.error(e); }
  };

  const handleDeleteClass = async (id: string) => {
    if (!window.confirm('Delete this class?')) return;
    try {
      await classesApi.delete(id);
      setClasses(classes.filter(c => c.id !== id));
      if (selectedClass?.id === id) setSelectedClass(null);
    } catch (e) { console.error(e); }
  };

  const loadMembers = async (cls: any) => {
    setSelectedClass(cls);
    try {
      const data = await classesApi.getMembers(cls.id);
      setMembers(data);
    } catch (e) { console.error(e); }
  };

  const handleAddMember = async () => {
    if (!selectedClass || !newStudentId.trim()) return;
    try {
      const added = await classesApi.addMember(selectedClass.id, newStudentId);
      setMembers([...members, added]);
      setNewStudentId('');
    } catch (e) { console.error(e); }
  };

  const handleRemoveMember = async (studentId: string) => {
    if (!selectedClass) return;
    try {
      await classesApi.removeMember(selectedClass.id, studentId);
      setMembers(members.filter(m => m.studentId !== studentId));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-gray-900">Manage Classes</h1>
        <div className="flex gap-2">
          <input
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            placeholder="New Class Name"
            className="border p-2 rounded-xl"
          />
          <button onClick={handleCreateClass} className="bg-blue-600 text-white px-4 rounded-xl font-bold flex items-center gap-2">
            <Plus size={18} /> Create
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 bg-white p-4 rounded-xl border">
          <h2 className="font-bold text-gray-800 mb-4 text-lg">My Classes</h2>
          {loading ? <p>Loading...</p> : (
            <div className="space-y-2">
              {classes.map(c => (
                <div key={c.id} onClick={() => loadMembers(c)} className={`p-3 rounded-xl border cursor-pointer flex justify-between items-center ${selectedClass?.id === c.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <div>
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.studentCount || 0} students</div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }} className="text-red-500 p-2"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-2 bg-white p-4 rounded-xl border">
          {selectedClass ? (
            <div>
              <h2 className="font-bold text-gray-800 mb-4 text-lg">{selectedClass.name} - Students</h2>
              <div className="flex gap-2 mb-4">
                <input
                  value={newStudentId}
                  onChange={e => setNewStudentId(e.target.value)}
                  placeholder="Student User ID"
                  className="border p-2 rounded-xl flex-1"
                />
                <button onClick={handleAddMember} className="bg-green-600 text-white px-4 rounded-xl font-bold">Add Student</button>
              </div>
              <div className="space-y-2">
                {members.map(m => (
                  <div key={m.id} className="p-3 border rounded-xl flex justify-between items-center">
                    <div>
                      <div className="font-bold">{m.user?.displayName || m.studentId}</div>
                      <div className="text-xs text-gray-500">{m.user?.username || ''}</div>
                    </div>
                    <button onClick={() => handleRemoveMember(m.studentId)} className="text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
                {members.length === 0 && <p className="text-gray-500 text-sm">No students in this class.</p>}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 p-10 text-center font-bold">Select a class to manage students</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherClassesView;
