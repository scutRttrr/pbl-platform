import { useState } from 'react';
import { evaluations, teams, students, abilityDimensions } from '../../data/mockData';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function Evaluation() {
  const [activeTeam, setActiveTeam] = useState('team1');
  const [selectedMember, setSelectedMember] = useState(null);

  const evalData = evaluations[activeTeam];
  const getStudentAvatar = (id) => students.find(s => s.id === id)?.avatar || '';

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--secondary)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getScoreLevel = (score) => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const member = selectedMember ? evalData.members.find(m => m.studentId === selectedMember) : null;

  const radarData = member ? abilityDimensions.map(d => ({
    dimension: d.label,
    score: member.scores[d.key],
    fullMark: 100,
  })) : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">📈 AI过程评估</div>
        <div className="page-subtitle">基于项目过程数据的结构化评估结果</div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {teams.map(t => (
          <button
            key={t.id}
            className={`btn ${activeTeam === t.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setActiveTeam(t.id); setSelectedMember(null); }}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏆 团队整体评分</div>
            <span className={`badge ${getScoreLevel(evalData.overallScore)}`}>
              评估日期：{evalData.evaluationDate}
            </span>
          </div>
          <div className="score-display" style={{ color: getScoreColor(evalData.overallScore), marginBottom: 20 }}>
            {evalData.overallScore}<span style={{ fontSize: 16, color: 'var(--text-muted)' }}>/100</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
            点击下方成员查看详细个人评估
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">👥 成员评分概览</div>
          </div>
          {evalData.members.map(m => (
            <div
              className="member-item"
              key={m.studentId}
              onClick={() => setSelectedMember(m.studentId)}
              style={{
                background: selectedMember === m.studentId ? 'var(--primary-50)' : 'transparent',
                border: selectedMember === m.studentId ? '1px solid var(--primary-light)' : '1px solid transparent',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span className="member-avatar">{getStudentAvatar(m.studentId)}</span>
              <div className="member-info">
                <div className="member-name">{m.name}</div>
                <div className="member-detail">
                  {m.anomaly ? <span style={{ color: 'var(--danger)' }}>⚠️ {m.anomaly.description.slice(0, 20)}...</span> : '无异常'}
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: getScoreColor(m.overallScore) }}>
                {m.overallScore}
              </div>
            </div>
          ))}
        </div>
      </div>

      {member && (
        <div className="fade-in">
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  {getStudentAvatar(member.studentId)} {member.name} - 能力雷达图
                </div>
              </div>
              <div className="radar-container">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="dimension" style={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} style={{ fontSize: 10 }} />
                    <Radar name={member.name} dataKey="score" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.25} strokeWidth={2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">📊 各维度得分</div>
              </div>
              {abilityDimensions.map(d => (
                <div className="score-bar" key={d.key}>
                  <span className="score-bar-label">{d.label}</span>
                  <div className="score-bar-track">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${member.scores[d.key]}%`,
                        background: `linear-gradient(90deg, ${getScoreColor(member.scores[d.key])}, ${getScoreColor(member.scores[d.key])}88)`,
                      }}
                    />
                  </div>
                  <span className="score-bar-value" style={{ color: getScoreColor(member.scores[d.key]) }}>
                    {member.scores[d.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: 20 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">📋 贡献记录</div>
              </div>
              {member.contributions.map((c, i) => (
                <div key={i} style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text)' }}>
                    {c.type === 'document' ? '📄' : c.type === 'discussion' ? '💬' : '💡'} {c.detail}
                  </strong>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">⏱ 时间投入</div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--primary)' }}>
                  {member.timeInvestment.totalHours}h
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>总投入时间</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{member.timeInvestment.weeklyAvg}h</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>周均</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>
                    {member.timeInvestment.trend === 'stable' ? '📊' : member.timeInvestment.trend === 'increasing' ? '📈' : '📉'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {member.timeInvestment.trend === 'stable' ? '稳定' : member.timeInvestment.trend === 'increasing' ? '上升' : '下降'}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">💡 AI分析</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--secondary)', marginBottom: 4 }}>✅ 优势</div>
                {member.strengths.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 12, marginBottom: 4 }}>• {s}</div>
                ))}
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>⚠️ 不足</div>
                {member.weaknesses.map((w, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 12, marginBottom: 4 }}>• {w}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>💡 建议</div>
                {member.suggestions.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 12, marginBottom: 4 }}>• {s}</div>
                ))}
              </div>
            </div>
          </div>

          {member.anomaly && (
            <div className={`alert-item ${member.anomaly.severity}`}>
              <div className="alert-icon">🔴</div>
              <div className="alert-content">
                <div className="alert-title">异常检测：{member.anomaly.type === 'low_participation' ? '参与度偏低' : '异常'}</div>
                <div className="alert-desc">{member.anomaly.description}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button className="btn btn-success">✅ 确认评估结果</button>
            <button className="btn btn-secondary">✏️ 修改评估</button>
            <button className="btn btn-outline">💬 添加人工评价</button>
          </div>
        </div>
      )}
    </div>
  );
}
