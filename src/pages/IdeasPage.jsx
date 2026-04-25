import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IdeaCard } from '../components/Cards';

export const IdeasPage = ({ ideas }) => {
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const filters = ['all', 'draft', 'validating', 'active', 'archived'];
  const filtered = useMemo(() => (filter === 'all' ? ideas : ideas.filter((i) => i.status === filter)), [filter, ideas]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#0D0C0A' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 600, color: '#F2EDE0' }}>Ideas</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6A6055', marginTop: 4 }}>{ideas.length} ideas tracked</div>
        </div>
        <button style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#D4A853', color: '#0D0C0A', cursor: 'pointer' }} onClick={() => navigate('/ideas/new')}>New Idea</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {filters.map((f) => (
          <button key={f} style={{ padding: '5px 12px', borderRadius: 999, border: `1px solid ${filter === f ? '#D4A85333' : '#2E2B23'}`, background: filter === f ? '#1E1A0F' : 'transparent', color: filter === f ? '#D4A853' : '#6A6055', cursor: 'pointer' }} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {filtered.map((idea) => <IdeaCard key={idea.id} {...idea} onClick={() => {}} />)}
      </div>
    </div>
  );
};

export const NewIdeaPage = ({ onAddIdea }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', status: 'draft', tags: '', desc: '' });

  const saveIdea = () => {
    if (!form.title.trim()) return;
    onAddIdea(form);
    navigate('/ideas');
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#0D0C0A' }}>
      <button onClick={() => navigate('/ideas')} style={{ color: '#6A6055', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}>Back to Ideas</button>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, color: '#F2EDE0', marginBottom: 28 }}>Capture New Idea</div>
      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <input style={{ background: '#18160F', border: '1px solid #2E2B23', borderRadius: 6, color: '#F2EDE0', padding: '9px 12px' }} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Idea title" />
        <select style={{ background: '#18160F', border: '1px solid #2E2B23', borderRadius: 6, color: '#F2EDE0', padding: '9px 12px' }} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="draft">Draft</option>
          <option value="validating">Validating</option>
          <option value="active">Active</option>
        </select>
        <input style={{ background: '#18160F', border: '1px solid #2E2B23', borderRadius: 6, color: '#F2EDE0', padding: '9px 12px' }} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (comma separated)" />
        <textarea style={{ background: '#18160F', border: '1px solid #2E2B23', borderRadius: 6, color: '#F2EDE0', padding: '9px 12px', minHeight: 110 }} value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="Description" />
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ padding: '9px 20px', borderRadius: 6, background: '#D4A853', color: '#0D0C0A', border: 'none', cursor: 'pointer' }} onClick={saveIdea}>Save Idea</button>
          <button style={{ padding: '9px 20px', borderRadius: 6, background: 'transparent', color: '#6A6055', border: '1px solid #2E2B23', cursor: 'pointer' }} onClick={() => navigate('/ideas')}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
