import { useState } from 'react';
import { C, alpha } from '../tokens';
import { useSuppliers, usePlans } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const inputStyle = { width: '100%', background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 6, color: C.fg1, fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 12px', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: C.fg2, marginBottom: 5, display: 'block' };

// Add / edit a supplier. `supplier` null = add mode. `plans` is the list
// of projects offered in the link multi-select.
function SupplierModal({ supplier, plans, onClose, onSave }) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [name,      setName]      = useState(supplier?.name      || '');
  const [materials, setMaterials] = useState(supplier?.materials || '');
  const [contact,   setContact]   = useState(supplier?.contact   || '');
  const [phone,     setPhone]     = useState(supplier?.phone     || '');
  const [email,     setEmail]     = useState(supplier?.email     || '');
  const [location,  setLocation]  = useState(supplier?.location  || '');
  const [price,     setPrice]     = useState(supplier?.price != null ? String(supplier.price) : '');
  const [unit,      setUnit]      = useState(supplier?.unit      || '');
  const [notes,     setNotes]     = useState(supplier?.notes     || '');
  const [projectIds, setProjectIds] = useState(Array.isArray(supplier?.projectIds) ? supplier.projectIds : []);

  const toggleProject = (id) => setProjectIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);

  const canSubmit = name.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const p = parseFloat(price);
      await onSave({
        name: name.trim(),
        materials: materials.trim(),
        contact: contact.trim(),
        phone: phone.trim(),
        email: email.trim(),
        location: location.trim(),
        price: price.trim() && Number.isFinite(p) ? p : null,
        unit: unit.trim(),
        notes: notes.trim(),
        projectIds,
      });
      onClose();
    } catch (err) {
      console.error('[SupplierModal]', err);
      showToast('Could not save the supplier. Please try again.', 'error');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,20,0.55)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ position: 'relative', background: C.bg0, borderRadius: 12, padding: '26px 24px', width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', animation: 'fadeIn 160ms ease' }}>
        <button onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 44, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.fg3, fontSize: 26, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>

        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.fg1, marginBottom: 18, paddingRight: 36 }}>
          {supplier ? 'Edit Supplier' : 'Add a Supplier'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} maxLength={100} placeholder="e.g. Konaseema Coir Cooperative" />
          </div>
          <div>
            <label style={labelStyle}>Materials supplied</label>
            <input style={inputStyle} value={materials} onChange={e => setMaterials(e.target.value)} maxLength={120} placeholder="e.g. Coconut husk, coir fibre" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Contact person</label>
              <input style={inputStyle} value={contact} onChange={e => setContact(e.target.value)} maxLength={80} placeholder="Name" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} maxLength={20} placeholder="+91…" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={120} placeholder="optional" />
          </div>
          <div>
            <label style={labelStyle}>Location</label>
            <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} maxLength={100} placeholder="e.g. Amalapuram, Konaseema" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Quoted price</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="optional" />
            </div>
            <div>
              <label style={labelStyle}>Unit</label>
              <input style={inputStyle} value={unit} onChange={e => setUnit(e.target.value)} maxLength={24} placeholder="e.g. ₹/kg, ₹/piece" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Linked projects</label>
            {plans.length === 0 ? (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, fontStyle: 'italic' }}>No projects yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 6, padding: 8 }}>
                {plans.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg1 }}>
                    <input type="checkbox" checked={projectIds.includes(p.id)} onChange={() => toggleProject(p.id)}
                      style={{ accentColor: C.accent, width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title || 'Untitled project'}</span>
                  </label>
                ))}
              </div>
            )}
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: C.fg3, marginTop: 4 }}>
              Tick every project this supplier feeds into.
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes (optional)</label>
            <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 60, lineHeight: 1.6 }} value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button onClick={onClose}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, padding: '9px 18px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 20px', borderRadius: 6, background: (!canSubmit || submitting) ? C.bg2 : C.accent, color: (!canSubmit || submitting) ? C.fg3 : '#fff', border: 'none', cursor: (!canSubmit || submitting) ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Saving…' : (supplier ? 'Save' : 'Add Supplier')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactLine({ icon, children }) {
  if (!children) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg2 }}>
      <span style={{ color: C.fg3, flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
    </div>
  );
}

function SupplierCard({ supplier, plans, canEdit, onEdit, onDelete }) {
  const linked = (supplier.projectIds || [])
    .map(id => plans.find(p => p.id === id))
    .filter(Boolean);

  return (
    <div style={{ background: C.bg1, border: `1px solid ${C.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700, color: C.fg1 }}>{supplier.name}</div>
          {supplier.materials && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, marginTop: 2 }}>{supplier.materials}</div>
          )}
        </div>
        {supplier.price != null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: C.fg1 }}>₹{supplier.price}</span>
            {supplier.unit && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: C.fg3 }}>{supplier.unit}</div>}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ContactLine icon={<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}>{supplier.contact}</ContactLine>
        <ContactLine icon={<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}>{supplier.phone}</ContactLine>
        <ContactLine icon={<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>}>{supplier.email}</ContactLine>
        <ContactLine icon={<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>}>{supplier.location}</ContactLine>
      </div>

      {linked.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {linked.map(p => (
            <span key={p.id} title={p.title}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: C.accent, background: alpha(C.accent, 13), border: `1px solid ${alpha(C.accent, 33)}`, borderRadius: 4, padding: '2px 7px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.title || 'Untitled'}
            </span>
          ))}
        </div>
      )}

      {supplier.notes && (
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.fg3, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{supplier.notes}</div>
      )}

      {canEdit && (
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 4 }}>
          <button onClick={onEdit}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '5px 12px', borderRadius: 6, background: 'transparent', color: C.fg2, border: `1px solid ${C.border}`, cursor: 'pointer' }}>Edit</button>
          <button onClick={onDelete}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, padding: '5px 12px', borderRadius: 6, background: 'transparent', color: C.danger, border: `1px solid ${alpha(C.danger, 33)}`, cursor: 'pointer' }}>Delete</button>
        </div>
      )}
    </div>
  );
}

// Supplier / vendor directory. A family-shared list of raw-material
// suppliers, each optionally linked to one or more projects.
export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const { plans } = usePlans();
  const { isViewer } = useAuth();
  const { showToast } = useToast();
  const [modal, setModal] = useState(null); // null | 'add' | supplier object
  const canEdit = !isViewer;

  const handleSave = async (data) => {
    if (modal && modal !== 'add') {
      await updateSupplier(modal.id, data);
      showToast('Supplier updated.', 'success');
    } else {
      await addSupplier(data);
      showToast('Supplier added.', 'success');
    }
  };

  const handleDelete = async (supplier) => {
    if (!window.confirm(`Delete “${supplier.name}”? This can't be undone.`)) return;
    try {
      await deleteSupplier(supplier.id);
      showToast('Supplier deleted.', 'success');
    } catch (err) {
      console.error('[SuppliersPage/delete]', err);
      showToast('Could not delete the supplier.', 'error');
    }
  };

  return (
    <div className="page-pad" style={{ background: C.bg0, flex: 1, overflowY: 'auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.06em', color: C.fg3, marginBottom: 10, textTransform: 'uppercase' }}>
          Directory
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="page-title" style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 34, fontWeight: 600, color: C.fg1, margin: 0, lineHeight: 1.15 }}>
              Suppliers
            </h1>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginTop: 4 }}>
              {suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'} tracked
            </div>
          </div>
          {canEdit && (
            <button onClick={() => setModal('add')}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
              + Add supplier
            </button>
          )}
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div style={{ background: C.bg1, border: `1px dashed ${C.border}`, borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 600, color: C.fg1, marginBottom: 6 }}>No suppliers yet</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.fg3, marginBottom: canEdit ? 18 : 0 }}>
            Add the vendors who supply your raw materials and link them to the projects they feed.
          </div>
          {canEdit && (
            <button onClick={() => setModal('add')}
              style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, padding: '9px 18px', borderRadius: 6, background: C.accent, color: '#fff', border: 'none', cursor: 'pointer' }}>
              + Add your first supplier
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {suppliers.map(s => (
            <SupplierCard key={s.id} supplier={s} plans={plans} canEdit={canEdit}
              onEdit={() => setModal(s)} onDelete={() => handleDelete(s)} />
          ))}
        </div>
      )}

      {modal && (
        <SupplierModal
          supplier={modal === 'add' ? null : modal}
          plans={plans}
          onClose={() => setModal(null)}
          onSave={handleSave} />
      )}
    </div>
  );
}
