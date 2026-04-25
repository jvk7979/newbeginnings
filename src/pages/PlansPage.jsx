import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../components/Cards';

export const PlansPage = ({ plans }) => {
  const navigate = useNavigate();

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#0D0C0A' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, color: '#F2EDE0' }}>Business Plans</div>
      </div>
      {plans.map((plan) => (
        <div key={plan.id} onClick={() => navigate(`/plans/${plan.id}`)} style={{ background: '#18160F', border: '1px solid #2E2B23', borderRadius: 8, padding: '20px 22px', marginBottom: 12, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, color: '#F2EDE0' }}>{plan.title}</div>
            <Badge status={plan.status} />
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6A6055', margin: '6px 0 10px' }}>Updated {plan.updated} · {plan.sections.length} sections</div>
          <div style={{ color: '#A39888', fontSize: 13 }}>{plan.summary}</div>
        </div>
      ))}
    </div>
  );
};

export const PlanDetailPage = ({ plans }) => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const plan = plans.find((p) => String(p.id) === planId) || plans[0];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', background: '#0D0C0A', maxWidth: 900 }}>
      <button onClick={() => navigate('/plans')} style={{ color: '#6A6055', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24 }}>Business Plans</button>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, color: '#F2EDE0', marginBottom: 8 }}>{plan.title}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#6A6055', marginBottom: 32 }}>Updated {plan.updated}</div>
      {plan.sections.map((sec) => (
        <div key={sec.title} style={{ marginBottom: 28, paddingBottom: 28, borderBottom: '1px solid #2E2B23' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: '#F2EDE0', marginBottom: 10 }}>{sec.title}</div>
          <div style={{ color: '#A39888', lineHeight: 1.7 }}>{sec.content}</div>
        </div>
      ))}
    </div>
  );
};
