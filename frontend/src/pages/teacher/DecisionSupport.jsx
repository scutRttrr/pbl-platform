import { useState } from 'react';
import { alerts, evaluations, teams, students } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DecisionSupport() {
  const [resolvedIds, setResolvedIds] = useState([]);

  const getStudentAvatar = (id) => students.find(s => s.id === id)?.avatar || '';

  const handleResolve = (id) => {
    setResolvedIds([...resolvedIds, id]);
  };

  const teamComparison = [
    { metric: '整体评分', team1: evaluations.team1.overallScore, team2: evaluations.team2.overallScore },
    { metric: '研究能力', team1: 79, team2: 74 },
    { metric: '协作能力', team1: 85, team2: 72 },
    { metric: '问题解决', team1: 80, team2: 74 },
    { metric: '沟通表达', team1: 81, team2: 69 },
    { metric: '创新能力', team1: 81, team2: 70 },
  ];

  const riskStudents = [];
  Object.values(evaluations).forEach(teamEval => {
    teamEval.members.forEach(m => {
      if (m.anomaly || m.overallScore < 65) {
        riskStudents.push({
          ...m,
          team: teams.find(t => t.id === teamEval.teamId)?.name,
        });
      }
    });
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">🎯 决策支持中心</div>
        <div className="page-subtitle">AI辅助教师进行项目监控与干预决策</div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon red">🚨</div>
          <div className="stat-content">
            <div className="stat-value">{alerts.filter(a => !resolvedIds.includes(a.id) && a.severity === 'high').length}</div>
            <div className="stat-label">高优先级告警</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{riskStudents.length}</div>
            <div className="stat-label">需关注学生</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon primary">📊</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round((evaluations.team1.overallScore + evaluations.team2.overallScore) / 2)}</div>
            <div className="stat-label">平均团队评分</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">🚨 系统告警与建议</div>
          </div>
          {alerts.map(alert => {
            const isResolved = resolvedIds.includes(alert.id);
            return (
              <div
                className={`alert-item ${isResolved ? 'low' : alert.severity}`}
                key={alert.id}
                style={{ opacity: isResolved ? 0.6 : 1 }}
              >
                <div className="alert-icon">
                  {isResolved ? '✅' : alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢'}
                </div>
                <div className="alert-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="alert-title">
                      {isResolved && <span style={{ color: 'var(--secondary)', marginRight: 6 }}>已处理</span>}
                      {alert.title}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{alert.timestamp}</span>
                  </div>
                  <div className="alert-desc">{alert.description}</div>
                  <div className="alert-suggestion">💡 建议：{alert.suggestion}</div>
                  {!isResolved && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <button className="btn btn-sm btn-success" onClick={() => handleResolve(alert.id)}>
                        ✅ 标记已处理
                      </button>
                      <button className="btn btn-sm btn-secondary">💬 发起沟通</button>
                      <button className="btn btn-sm btn-outline">🔕 忽略</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">⚠️ 需关注学生</div>
            </div>
            {riskStudents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <p>当前没有需要关注的学生</p>
              </div>
            ) : (
              riskStudents.map(s => (
                <div className="member-item" key={s.studentId} style={{ borderLeft: '3px solid var(--danger)', paddingLeft: 16, marginBottom: 8 }}>
                  <span className="member-avatar">{getStudentAvatar(s.studentId)}</span>
                  <div className="member-info">
                    <div className="member-name">{s.name}</div>
                    <div className="member-detail">{s.team}</div>
                    {s.anomaly && (
                      <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
                        ⚠️ {s.anomaly.description.slice(0, 40)}...
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--danger)' }}>
                    {s.overallScore}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">📊 团队对比分析</div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={teamComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="metric" style={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} style={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="team1" fill="#4F46E5" name="AI教育创新组" radius={[4, 4, 0, 0]} />
                <Bar dataKey="team2" fill="#10B981" name="智慧课堂组" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">🤖 AI综合建议</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, background: '#FEF2F2', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>🔴 紧急关注</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              团队2的孙八同学参与度持续走低，建议尽快安排一对一面谈，了解其遇到的困难。
              同时可考虑将部分任务临时分配给其他成员，确保团队进度不受影响。
            </p>
          </div>
          <div style={{ padding: 16, background: '#FFFBEB', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', marginBottom: 8 }}>🟡 进度关注</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              团队2整体进度落后预期约1周。建议在下次讨论中帮助团队重新梳理任务优先级，
              必要时调整里程碑时间节点。
            </p>
          </div>
          <div style={{ padding: 16, background: '#ECFDF5', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--secondary)', marginBottom: 8 }}>🟢 积极发现</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              团队1协作氛围良好，成员间互动频繁。张三在研究方面表现突出，赵六展现了优秀的
              创新设计能力。建议在项目展示环节充分发挥其各自优势。
            </p>
          </div>
          <div style={{ padding: 16, background: 'var(--primary-50)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>💡 教学建议</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              两个团队在技术实现方面均有较大提升空间。建议安排一次跨组技术交流会，
              让团队1的王五分享架构设计经验，促进团队间知识共享。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
