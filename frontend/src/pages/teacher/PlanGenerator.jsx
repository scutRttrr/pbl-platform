import { useMemo, useState } from 'react';

export default function PlanGenerator() {
  const [form, setForm] = useState({
    description:
      '基于真实特殊教育场景，设计一个跨学科 PBL 教学教案生成系统。内容需要覆盖课程目标、活动设计、角色分工、阶段性产出物、评价方式与反思建议，适用于高校课程或教师培训场景。',
    total_pages: 5,
    reference_mode: false,
    reference_text: '',
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const formattedResult = useMemo(() => {
    if (!result) {
      return '';
    }
    return JSON.stringify(result, null, 2);
  }, [result]);

  const handleGenerate = async () => {
    const trimmedDescription = form.description.trim();
    const totalPages = Number(form.total_pages);

    if (!trimmedDescription) {
      setError('description 不能为空。');
      return;
    }
    if (!Number.isInteger(totalPages) || totalPages <= 0) {
      setError('total_pages 必须是正整数。');
      return;
    }

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: trimmedDescription,
          total_pages: totalPages,
          reference_mode: form.reference_mode,
          reference_text: form.reference_text,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || `请求失败（HTTP ${response.status}）`);
      }

      setResult(data);
    } catch (requestError) {
      setError(requestError.message || '调用生成接口失败，请稍后重试。');
    } finally {
      setGenerating(false);
    }
  };

  const pages = Array.isArray(result?.pages) ? result.pages : [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title">🤖 教学方案生成</div>
        <div className="page-subtitle">调用后端教案生成接口，并在右侧展示返回 JSON 与分页内容</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📝 生成参数（与后端接口一致）</div>
          </div>

          <div className="form-group">
            <label className="form-label">description</label>
            <textarea
              className="form-textarea"
              style={{ minHeight: 180 }}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">total_pages</label>
            <input
              className="form-input"
              type="number"
              min="1"
              max="20"
              value={form.total_pages}
              onChange={(event) => setForm({ ...form, total_pages: event.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 10 }}>
              reference_mode
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={form.reference_mode}
                onChange={(event) => setForm({ ...form, reference_mode: event.target.checked })}
              />
              使用参考文本风格
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">reference_text</label>
            <textarea
              className="form-textarea"
              value={form.reference_text}
              placeholder="可选：粘贴参考文档文本"
              onChange={(event) => setForm({ ...form, reference_text: event.target.value })}
            />
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? '⏳ 生成中...' : '✨ 生成教案'}
          </button>
        </div>

        <div>
          {generating && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="generating">
                <div className="generating-dots">
                  <span /><span /><span />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>正在调用 /api/generate ...</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    请求参数：description、total_pages、reference_mode、reference_text
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title">⚠️ 接口错误</div>
              </div>
              <p style={{ color: 'var(--danger)', fontSize: 14 }}>{error}</p>
            </div>
          )}

          {result && (
            <div className="fade-in">
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div className="card-title">🧾 后端返回 JSON</div>
                </div>
                <pre className="json-preview">{formattedResult}</pre>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">📄 教案分页结果</div>
                </div>
                {!pages.length && (
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>当前返回中没有 pages 数据。</p>
                )}
                {pages.map((page, index) => (
                  <div className="plan-page" key={`${page.index}-${index}`}>
                    <div className="plan-page-title">
                      {(page.index ?? index) + 1}. {page.title || '未命名标题'}
                    </div>
                    <div className="plan-page-body">{page.body || ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!generating && !result && !error && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🤖</div>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>后端接口联调</p>
                <p style={{ fontSize: 14 }}>
                  填写左侧 API 参数后点击“生成教案”<br />
                  右侧将展示后端返回的 JSON 和分页内容
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
