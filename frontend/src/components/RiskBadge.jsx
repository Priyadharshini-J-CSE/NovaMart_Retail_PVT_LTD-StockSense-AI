export default function RiskBadge({ risk }) {
  const cls = risk === 'High' ? 'badge-high' : risk === 'Medium' ? 'badge-medium' : 'badge-low';
  return <span className={`badge ${cls}`}>{risk}</span>;
}
