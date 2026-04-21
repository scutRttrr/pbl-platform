import { evaluations, students, abilityDimensions } from '../../data/mockData';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function StudentReport() {
  const currentStudent = students[0]; // 张三
  const myEval = evaluations.team1.members.find(m => m.studentId === currentStudent.id);

  const radarData = abilityDimensions.map(d => ({
    dimension: d.label,
    score: myEval.scores[d.key],
    fullMark: 100,
  }));

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--secondary)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">📊 能力报告</div>
        <div className="page-subtitle">个性化能力分析与反馈</div>
      </div>

      {/* 统计卡片 — 仅保留时间投入相关，移除综合评分 */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon green">⏱</div>
          <div className="stat-content">
            <div className="stat-value">{myEval.timeInvestment.totalHours}h</div>
            <div className="stat-label">总投入时间</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">📈</div>
          <div className="stat-content">
            <div className="stat-value">{myEval.timeInvestment.weeklyAvg}h</div>
            <div className="stat-label">周均投入</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary">📊</div>
          <div className="stat-content">
            <div className="stat-value">
              {myEval.timeInvestment.trend === 'stable' ? '稳定' : myEval.timeInvestment.trend === 'increasing' ? '上升' : '下降'}
            </div>
            <div className="stat-label">投入趋势</div>
          </div>
        </div>
      </div>

      {/* 雷达图 + 各维度得分（移除团队对比柱状图） */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">🎯 能力雷达图</div>
          </div>
          <div className="radar-container">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="dimension" style={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} style={{ fontSize: 10 }} />
                <Radar name="我的得分" dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 各维度详细得分</div>
          </div>
          {abilityDimensions.map(d => {
            const score = myEval.scores[d.key];
            return (
              <div className="score-bar" key={d.key}>
                <span className="score-bar-label">{d.label}</span>
                <div className="score-bar-track">
                  <div
                    className="score-bar-fill"
                    style={{
                      width: `${score}%`,
                      background: `linear-gradient(90deg, ${getScoreColor(score)}, ${getScoreColor(score)}88)`,
                    }}
                  />
                </div>
                <span className="score-bar-value" style={{ color: getScoreColor(score) }}>{score}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 贡献记录 */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">💡 有价值贡献记录</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {myEval.contributions.map((c, i) => (
            <div key={i} style={{ padding: 14, background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 18 }}>
                  {c.type === 'document' ? '📄' : c.type === 'discussion' ? '💬' : '💡'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
                  {c.type === 'document' ? '文档贡献' : c.type === 'discussion' ? '讨论参与' : '关键想法'}
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{c.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 优势与改进建议 */}
      <div className="grid-2">
        <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div className="card-header">
            <div className="card-title">✅ 你的优势</div>
          </div>
          {myEval.strengths.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--secondary)', fontSize: 16 }}>💪</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{s}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="card-header">
            <div className="card-title">📈 改进建议</div>
          </div>
          {myEval.weaknesses.map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--warning)', fontSize: 16 }}>⚠️</span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{w}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: 12, background: 'var(--primary-50)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>💡 个性化建议</div>
            {myEval.suggestions.map((s, i) => (
              <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, paddingLeft: 16 }}>
                {i + 1}. {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
