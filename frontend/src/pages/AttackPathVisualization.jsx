import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { Network, RefreshCw, AlertTriangle, Shield, Server, Database, Wifi, User, Info, X } from 'lucide-react';

// ── Node type config ──────────────────────────────────────────────────────
const NODE_CONFIG = {
  source:         { icon: Wifi,     color: '#64748b', bg: '#1e293b', label: 'Source'         },
  ip:             { icon: Wifi,     color: '#ef4444', bg: '#450a0a', label: 'IP Address'      },
  user:           { icon: User,     color: '#f97316', bg: '#431407', label: 'User Account'    },
  infrastructure: { icon: Shield,   color: '#3b82f6', bg: '#172554', label: 'Infrastructure'  },
  server:         { icon: Server,   color: '#22c55e', bg: '#052e16', label: 'Server'          },
  database:       { icon: Database, color: '#a855f7', bg: '#2e1065', label: 'Database'        },
};

const STATUS_COLOR = {
  active:    '#22c55e',
  suspicious:'#f97316',
  blocked:   '#ef4444',
  locked:    '#ef4444',
  neutral:   '#64748b',
};

const RISK_COLOR = (r) =>
  r >= 80 ? '#ef4444' : r >= 60 ? '#f97316' : r >= 40 ? '#eab308' : '#22c55e';

const EDGE_COLOR = {
  high:   '#ef4444',
  medium: '#f97316',
  low:    '#22c55e',
};

// ── Pre-computed layout positions ─────────────────────────────────────────
// We assign fixed column-row positions then dynamically override with data
function assignPositions(nodes) {
  const TYPE_COL = { source: 0, ip: 1, user: 2, infrastructure: 3, server: 4, database: 5 };
  const colCounts = {};
  return nodes.map(n => {
    const col = TYPE_COL[n.type] ?? 3;
    colCounts[col] = (colCounts[col] || 0) + 1;
    const row = colCounts[col] - 1;
    return { ...n, _col: col, _row: row };
  });
}

const COL_X = [60, 180, 300, 440, 580, 720];
const ROW_H = 90;
const GRAPH_H = 400;

// ── SVG Graph ─────────────────────────────────────────────────────────────
const AttackGraph = ({ nodes, edges, onNodeClick, selected }) => {
  const svgRef = useRef(null);
  const positioned = assignPositions(nodes);

  const nodePos = {};
  const colRowY = {};
  positioned.forEach(n => {
    const x = COL_X[n._col] ?? 100;
    colRowY[n._col] = (colRowY[n._col] || 0);
    const y = 60 + colRowY[n._col] * ROW_H;
    colRowY[n._col] += 1;
    nodePos[n.id] = { x, y };
  });

  return (
    <svg ref={svgRef} width="100%" viewBox={`0 0 800 ${GRAPH_H}`} className="overflow-visible">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#475569" />
        </marker>
        <marker id="arrowhead-high" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
        </marker>
        <marker id="arrowhead-medium" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#f97316" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((e, i) => {
        const src = nodePos[e.source];
        const dst = nodePos[e.target];
        if (!src || !dst) return null;
        const mx = (src.x + dst.x) / 2;
        const my = (src.y + dst.y) / 2 - 20;
        const color = EDGE_COLOR[e.risk_level] || '#475569';
        const markerId = e.risk_level === 'high' ? 'arrowhead-high' : e.risk_level === 'medium' ? 'arrowhead-medium' : 'arrowhead';
        return (
          <g key={i}>
            <path
              d={`M ${src.x} ${src.y} Q ${mx} ${my} ${dst.x} ${dst.y}`}
              fill="none" stroke={color} strokeWidth={e.risk_level === 'high' ? 2 : 1.5}
              strokeDasharray={e.risk_level === 'low' ? '4 3' : 'none'}
              markerEnd={`url(#${markerId})`} opacity="0.7"
            />
            <text x={mx} y={my - 4} textAnchor="middle" fill="#64748b" fontSize="9">
              {e.label}
            </text>
          </g>
        );
      })}

      {/* Nodes */}
      {positioned.map(n => {
        const pos = nodePos[n.id];
        if (!pos) return null;
        const cfg = NODE_CONFIG[n.type] || NODE_CONFIG.infrastructure;
        const isSelected = selected?.id === n.id;
        const statusColor = STATUS_COLOR[n.status] || '#64748b';
        return (
          <g key={n.id} transform={`translate(${pos.x}, ${pos.y})`}
            onClick={() => onNodeClick(n)}
            className="cursor-pointer">
            {/* Glow ring when selected */}
            {isSelected && (
              <circle r="28" fill="none" stroke={cfg.color} strokeWidth="2" opacity="0.5" />
            )}
            {/* Node circle */}
            <circle r="22" fill={cfg.bg} stroke={cfg.color} strokeWidth={isSelected ? 2.5 : 1.5} />
            {/* Status dot */}
            <circle r="5" cx="15" cy="-15" fill={statusColor} stroke="#0f172a" strokeWidth="1.5" />
            {/* Risk indicator arc */}
            {n.risk > 0 && (
              <circle r="22" fill="none" stroke={RISK_COLOR(n.risk)} strokeWidth="3"
                strokeDasharray={`${(n.risk / 100) * 138} 138`} opacity="0.5"
                transform="rotate(-90)" />
            )}
            {/* Label */}
            <text y="38" textAnchor="middle" fill="#94a3b8" fontSize="9" className="pointer-events-none">
              {n.label.length > 14 ? n.label.slice(0, 14) + '…' : n.label}
            </text>
            <text y="48" textAnchor="middle" fill="#64748b" fontSize="8">
              {n.type}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Severity badge ─────────────────────────────────────────────────────────
const SEV = {
  CRITICAL: 'bg-red-900/40 text-red-300 border-red-700',
  HIGH:     'bg-orange-900/40 text-orange-300 border-orange-700',
  MEDIUM:   'bg-yellow-900/40 text-yellow-300 border-yellow-700',
  LOW:      'bg-blue-900/40 text-blue-300 border-blue-700',
};

// ── Main ──────────────────────────────────────────────────────────────────
const AttackPathVisualization = () => {
  const [data, setData]         = useState({ nodes: [], edges: [], attack_chains: [] });
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/threat/attack-paths').then(r => r.data);
      setData(res);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('AttackPath fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, [fetchData]);

  const handleNodeClick = (node) => {
    setSelected(prev => prev?.id === node.id ? null : node);
  };

  const legendItems = Object.entries(NODE_CONFIG).map(([type, cfg]) => ({ type, ...cfg }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Network className="text-green-400 w-6 h-6" /> Attack Path Visualization
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Correlated event graph · last 48 hours · auto-refreshes every 30 s</p>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && <span className="text-xs text-slate-500">{lastRefresh.toLocaleTimeString()}</span>}
          <button onClick={fetchData} className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-3 text-xs text-blue-300 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        This graph visualises <strong>detected event relationships</strong> only. No attack is simulated or executed. Click any node to inspect related activity.
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw className="w-6 h-6 animate-spin text-blue-400" /></div>
      ) : (
        <>
          {/* Graph canvas */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 overflow-x-auto">
            <AttackGraph
              nodes={data.nodes} edges={data.edges}
              onNodeClick={handleNodeClick} selected={selected}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {legendItems.map(({ type, color, label }) => (
              <span key={type} className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
            <span className="text-slate-600 ml-2">|</span>
            {Object.entries(STATUS_COLOR).map(([s, c]) => (
              <span key={s} className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} /> {s}
              </span>
            ))}
          </div>

          {/* Node detail panel */}
          {selected && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" /> Node: {selected.label}
                </h3>
                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: 'Type',       value: selected.type },
                  { label: 'Status',     value: selected.status },
                  { label: 'Risk Score', value: `${selected.risk}%` },
                  { label: 'Node ID',    value: selected.id },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-900/60 rounded-lg p-3">
                    <p className="text-slate-500 mb-0.5">{label}</p>
                    <p className="font-semibold text-slate-200">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attack chains */}
          {data.attack_chains?.length > 0 && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-400" /> Detected Incident Chains
              </h3>
              <div className="space-y-3">
                {data.attack_chains.map(c => (
                  <div key={c.id} className="bg-slate-900/60 border border-slate-700 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-200 text-sm">{c.threat_type}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded border font-semibold flex-shrink-0 ${SEV[c.severity] || SEV.LOW}`}>
                        {c.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">Action: {c.action} · {c.timestamp ? new Date(c.timestamp).toLocaleString() : '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttackPathVisualization;
