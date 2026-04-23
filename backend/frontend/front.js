// frontend/front.js
// @ts-check

/**
 * @typedef {{
 *   index: number,
 *   title: string,
 *   body: string
 * }} PageContent
 */

/**
 * @typedef {{
 *   pages: PageContent[]
 * }} GenerationResult
 */

/**
 * @typedef {{
 *   file_name: string,
 *   reference_text: string,
 *   preview: string,
 *   message: string
 * }} UploadResponse
 */

/**
 * @typedef {{
 *   job_id: string,
 *   status: string,
 *   total_pages: number
 * }} AsyncGenerateResponse
 */

/**
 * @typedef {{
 *   job_id: string,
 *   status: "queued" | "running" | "completed" | "failed",
 *   total_pages: number,
 *   completed_pages: number,
 *   pages: PageContent[],
 *   error: string
 * }} JobStatusResponse
 */

class PBLApp {
  /**
   * Create app instance.
   */
  constructor() {
    /** @private @type {HTMLTextAreaElement | null} */
    this.descriptionEl = document.getElementById("description") instanceof HTMLTextAreaElement
      ? document.getElementById("description")
      : null;

    /** @private @type {HTMLInputElement | null} */
    this.totalPagesEl = document.getElementById("totalPages") instanceof HTMLInputElement
      ? document.getElementById("totalPages")
      : null;

    /** @private @type {HTMLButtonElement | null} */
    this.generateBtn = document.getElementById("generateBtn") instanceof HTMLButtonElement
      ? document.getElementById("generateBtn")
      : null;

    /** @private @type {HTMLButtonElement | null} */
    this.exportBtn = document.getElementById("exportBtn") instanceof HTMLButtonElement
      ? document.getElementById("exportBtn")
      : null;

    /** @private @type {HTMLButtonElement | null} */
    this.clearBtn = document.getElementById("clearBtn") instanceof HTMLButtonElement
      ? document.getElementById("clearBtn")
      : null;

    /** @private @type {HTMLInputElement | null} */
    this.referenceFileEl = document.getElementById("referenceFile") instanceof HTMLInputElement
      ? document.getElementById("referenceFile")
      : null;

    /** @private @type {HTMLInputElement | null} */
    this.useReferenceEl = document.getElementById("useReference") instanceof HTMLInputElement
      ? document.getElementById("useReference")
      : null;

    /** @private @type {HTMLDivElement | null} */
    this.fileInfoEl = document.getElementById("fileInfo") instanceof HTMLDivElement
      ? document.getElementById("fileInfo")
      : null;

    /** @private @type {HTMLDivElement | null} */
    this.statusEl = document.getElementById("status") instanceof HTMLDivElement
      ? document.getElementById("status")
      : null;

    /** @private @type {HTMLDivElement | null} */
    this.pagesEl = document.getElementById("pages") instanceof HTMLDivElement
      ? document.getElementById("pages")
      : null;

    /** @private @type {PageContent[]} */
    this.pages = [];

    /** @private @type {string} */
    this.referenceText = "";

    /** @private @type {string} */
    this.referenceFileName = "";

    /** @private @type {string} */
    this.currentJobId = "";

    /** @private @type {number | null} */
    this.pollTimerId = null;

    /** @private @type {boolean} */
    this.isGenerating = false;

    this.bindEvents();
  }

  /**
   * Bind UI events.
   *
   * 原理：集中事件绑定，避免全局函数和重复监听导致状态不一致。
   *
   * @private
   * @returns {void}
   */
  bindEvents() {
    if (this.generateBtn) {
      this.generateBtn.addEventListener("click", () => {
        void this.generateAllPages();
      });
    }

    if (this.exportBtn) {
      this.exportBtn.addEventListener("click", () => {
        void this.exportDocx();
      });
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener("click", () => {
        this.clearAll();
      });
    }

    if (this.referenceFileEl) {
      this.referenceFileEl.addEventListener("change", () => {
        void this.uploadReferenceFile();
      });
    }

    window.addEventListener("beforeunload", () => {
      this.stopPolling();
    });
  }

  /**
   * Get current description.
   *
   * @private
   * @returns {string}
   */
  getDescription() {
    return this.descriptionEl ? this.descriptionEl.value.trim() : "";
  }

  /**
   * Get current total pages.
   *
   * @private
   * @returns {number}
   */
  getTotalPages() {
    if (!this.totalPagesEl) {
      return 0;
    }
    return Number(this.totalPagesEl.value);
  }

  /**
   * Whether to use reference mode.
   *
   * @private
   * @returns {boolean}
   */
  shouldUseReference() {
    return Boolean(this.useReferenceEl && this.useReferenceEl.checked && this.referenceText);
  }

  /**
   * Set status text.
   *
   * @param {string} message - Message content.
   * @param {boolean} isError - Whether it is an error.
   * @returns {void}
   */
  setStatus(message, isError = false) {
    if (!this.statusEl) {
      return;
    }
    this.statusEl.textContent = message;
    this.statusEl.className = isError ? "status visible error" : "status visible";
  }

  /**
   * Clear status.
   *
   * @returns {void}
   */
  clearStatus() {
    if (!this.statusEl) {
      return;
    }
    this.statusEl.textContent = "";
    this.statusEl.className = "status";
  }

  /**
   * Toggle top buttons.
   *
   * @param {boolean} disabled - Disabled flag.
   * @returns {void}
   */
  toggleTopButtons(disabled) {
    if (this.generateBtn) {
      this.generateBtn.disabled = disabled;
    }
    if (this.exportBtn) {
      this.exportBtn.disabled = disabled;
    }
  }

  /**
   * Start async generation and progressively render pages.
   *
   * 原理：先启动后台任务获取 job_id，再轮询任务状态，前端每次拿到新页就重新渲染。
   *
   * @returns {Promise<void>}
   */
  async generateAllPages() {
    const description = this.getDescription();
    const totalPages = this.getTotalPages();

    if (!description) {
      this.setStatus("请输入课程描述 / 生成需求。", true);
      return;
    }
    if (!Number.isInteger(totalPages) || totalPages <= 0) {
      this.setStatus("页数必须是正整数。", true);
      return;
    }

    this.stopPolling();
    this.pages = [];
    this.renderPages();
    this.currentJobId = "";
    this.isGenerating = true;
    this.toggleTopButtons(true);
    this.setStatus("已开始生成，教案会在生成过程中逐页显示...");

    try {
      const response = await fetch("/api/generate-async", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          description,
          total_pages: totalPages,
          reference_mode: this.shouldUseReference(),
          reference_text: this.referenceText
        })
      });

      const payload = await this.parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(this.getErrorMessage(payload, "启动生成任务失败"));
      }

      /** @type {AsyncGenerateResponse} */
      const result = /** @type {AsyncGenerateResponse} */ (payload);
      this.currentJobId = result.job_id;
      await this.pollJobStatus();
    } catch (error) {
      this.isGenerating = false;
      this.toggleTopButtons(false);
      this.setStatus(this.normalizeError(error), true);
    }
  }

  /**
   * Poll current job until it finishes.
   *
   * @private
   * @returns {Promise<void>}
   */
  async pollJobStatus() {
    if (!this.currentJobId) {
      this.isGenerating = false;
      this.toggleTopButtons(false);
      return;
    }

    try {
      const response = await fetch(`/api/job-status?job_id=${encodeURIComponent(this.currentJobId)}`, {
        method: "GET"
      });

      const payload = await this.parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(this.getErrorMessage(payload, "获取任务状态失败"));
      }

      /** @type {JobStatusResponse} */
      const job = /** @type {JobStatusResponse} */ (payload);
      this.syncPages(job.pages);

      if (job.status === "queued" || job.status === "running") {
        this.setStatus(`正在生成中：${job.completed_pages}/${job.total_pages} 页已完成。`);
        this.pollTimerId = window.setTimeout(() => {
          void this.pollJobStatus();
        }, 1200);
        return;
      }

      this.stopPolling();
      this.isGenerating = false;
      this.toggleTopButtons(false);

      if (job.status === "completed") {
        this.setStatus(`全部生成完成：${job.completed_pages}/${job.total_pages} 页。`);
        return;
      }

      if (job.status === "failed") {
        this.setStatus(`生成失败：${job.error || "未知错误"}`, true);
        return;
      }

      this.setStatus("任务状态未知。", true);
    } catch (error) {
      this.stopPolling();
      this.isGenerating = false;
      this.toggleTopButtons(false);
      this.setStatus(this.normalizeError(error), true);
    }
  }

  /**
   * Stop polling timer.
   *
   * @private
   * @returns {void}
   */
  stopPolling() {
    if (this.pollTimerId !== null) {
      window.clearTimeout(this.pollTimerId);
      this.pollTimerId = null;
    }
  }

  /**
   * Merge server pages into current UI state.
   *
   * @private
   * @param {PageContent[]} nextPages - Latest pages from server.
   * @returns {void}
   */
  syncPages(nextPages) {
    const nextMap = new Map();
    nextPages.forEach((page) => {
      nextMap.set(page.index, page);
    });

    /** @type {PageContent[]} */
    const merged = [];

    nextMap.forEach((page, key) => {
      const existing = this.pages.find((item) => item.index === key);
      if (existing) {
        merged.push({
          index: page.index,
          title: page.title,
          body: page.body
        });
        return;
      }
      merged.push(page);
    });

    merged.sort((left, right) => left.index - right.index);
    this.pages = merged;
    this.renderPages();
  }

  /**
   * Regenerate a single page.
   *
   * @param {number} pageIndex - Page index.
   * @returns {Promise<void>}
   */
  async regeneratePage(pageIndex) {
    const description = this.getDescription();
    const totalPages = this.getTotalPages();

    if (!description) {
      this.setStatus("请输入课程描述 / 生成需求。", true);
      return;
    }
    if (pageIndex < 0 || pageIndex >= this.pages.length) {
      this.setStatus("页面索引超出范围。", true);
      return;
    }

    this.setStatus(`正在重生成第 ${pageIndex + 1} 页...`);

    try {
      const response = await fetch("/api/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          description,
          total_pages: totalPages,
          page_index: pageIndex,
          reference_mode: this.shouldUseReference(),
          reference_text: this.referenceText
        })
      });

      const payload = await this.parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(this.getErrorMessage(payload, "单页重生成失败"));
      }

      /** @type {PageContent} */
      const page = /** @type {PageContent} */ (payload);
      const targetIndex = this.pages.findIndex((item) => item.index === page.index);
      if (targetIndex >= 0) {
        this.pages[targetIndex] = page;
      } else {
        this.pages.push(page);
        this.pages.sort((left, right) => left.index - right.index);
      }

      this.renderPages();
      this.setStatus(`第 ${page.index + 1} 页重生成完成。`);
    } catch (error) {
      this.setStatus(this.normalizeError(error), true);
    }
  }

  /**
   * Upload reference document.
   *
   * @returns {Promise<void>}
   */
  async uploadReferenceFile() {
    if (!(this.referenceFileEl && this.referenceFileEl.files && this.referenceFileEl.files.length > 0)) {
      this.referenceText = "";
      this.referenceFileName = "";
      if (this.fileInfoEl) {
        this.fileInfoEl.textContent = "未上传参考文件。";
      }
      return;
    }

    const file = this.referenceFileEl.files[0];
    const formData = new FormData();
    formData.append("file", file);

    this.setStatus(`正在上传并解析参考文档：${file.name} ...`);

    try {
      const response = await fetch("/api/upload-source", {
        method: "POST",
        body: formData
      });

      const payload = await this.parseJsonResponse(response);
      if (!response.ok) {
        throw new Error(this.getErrorMessage(payload, "上传参考文档失败"));
      }

      /** @type {UploadResponse} */
      const result = /** @type {UploadResponse} */ (payload);
      this.referenceText = result.reference_text;
      this.referenceFileName = result.file_name;

      if (this.fileInfoEl) {
        const preview = result.preview.length > 120
          ? `${result.preview.slice(0, 120)}...`
          : result.preview;
        this.fileInfoEl.textContent = `${result.file_name} 已加载。预览：${preview}`;
      }

      this.setStatus(result.message);
    } catch (error) {
      this.referenceText = "";
      this.referenceFileName = "";
      if (this.fileInfoEl) {
        this.fileInfoEl.textContent = "未上传参考文件。";
      }
      this.setStatus(this.normalizeError(error), true);
    }
  }

  /**
   * Export current pages to DOCX.
   *
   * @returns {Promise<void>}
   */
  async exportDocx() {
    if (this.pages.length === 0) {
      this.setStatus("当前没有可导出的页面，请先生成内容。", true);
      return;
    }

    this.setStatus("正在导出 DOCX，请稍候...");

    try {
      const response = await fetch("/api/export-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "PBL 教学教案",
          pages: this.pages.map((page, index) => ({
            index,
            title: page.title,
            body: page.body
          }))
        })
      });

      if (!response.ok) {
        const payload = await this.parseJsonResponse(response);
        throw new Error(this.getErrorMessage(payload, "导出 DOCX 失败"));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "PBL 教学教案.docx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      this.setStatus("DOCX 导出完成。");
    } catch (error) {
      this.setStatus(this.normalizeError(error), true);
    }
  }

  /**
   * Clear current pages and stop polling.
   *
   * @returns {void}
   */
  clearAll() {
    this.stopPolling();
    this.currentJobId = "";
    this.isGenerating = false;
    this.pages = [];
    this.toggleTopButtons(false);

    if (this.pagesEl) {
      this.pagesEl.innerHTML = "";
    }
    this.clearStatus();
  }

  /**
   * Render all pages.
   *
   * @returns {void}
   */
  renderPages() {
    if (!this.pagesEl) {
      return;
    }

    this.pagesEl.innerHTML = "";
    this.pages.forEach((page) => {
      this.pagesEl.appendChild(this.createPageNode(page));
    });
  }

  /**
   * Create page node.
   *
   * @param {PageContent} page - Page data.
   * @returns {HTMLDivElement}
   */
  createPageNode(page) {
    const wrapper = document.createElement("div");
    wrapper.className = "page-card";
    wrapper.dataset.pageIndex = String(page.index);

    const head = document.createElement("div");
    head.className = "page-head";

    const title = document.createElement("h3");
    title.textContent = page.title;

    const actions = document.createElement("div");
    actions.className = "page-actions";

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "btn btn-secondary";
    previewBtn.textContent = "预览本页";
    previewBtn.addEventListener("click", () => {
      this.previewPage(page.index);
    });

    const regenBtn = document.createElement("button");
    regenBtn.type = "button";
    regenBtn.className = "btn btn-warning";
    regenBtn.textContent = "单页重生成";
    regenBtn.addEventListener("click", () => {
      void this.regeneratePage(page.index);
    });

    const exportOneBtn = document.createElement("button");
    exportOneBtn.type = "button";
    exportOneBtn.className = "btn btn-secondary";
    exportOneBtn.textContent = "导出本页 DOCX";
    exportOneBtn.addEventListener("click", () => {
      void this.exportSinglePage(page.index);
    });

    actions.appendChild(previewBtn);
    actions.appendChild(regenBtn);
    actions.appendChild(exportOneBtn);
    head.appendChild(title);
    head.appendChild(actions);

    const body = document.createElement("div");
    body.className = "page-body";

    const textArea = document.createElement("textarea");
    textArea.className = "page-textarea";
    textArea.value = page.body;
    textArea.addEventListener("input", () => {
      const targetPage = this.pages.find((item) => item.index === page.index);
      if (targetPage) {
        targetPage.body = textArea.value;
      }
    });

    body.appendChild(textArea);
    wrapper.appendChild(head);
    wrapper.appendChild(body);
    return wrapper;
  }

  /**
   * Preview one page in a new browser window.
   *
   * @param {number} pageIndex - Page index.
   * @returns {void}
   */
  previewPage(pageIndex) {
    const page = this.pages.find((item) => item.index === pageIndex);
    if (!page) {
      this.setStatus("未找到要预览的页面。", true);
      return;
    }

    const previewWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!previewWindow) {
      this.setStatus("浏览器阻止了预览窗口，请允许弹窗。", true);
      return;
    }

    const escapedTitle = this.escapeHtml(page.title);
    const escapedBody = this.escapeHtml(page.body).replace(/\n/g, "<br />");

    previewWindow.document.open();
    previewWindow.document.write(
      `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${escapedTitle}</title>
  <style>
    body {
      max-width: 900px;
      margin: 32px auto;
      padding: 0 20px;
      font-family: Arial, "PingFang SC", "Microsoft YaHei", sans-serif;
      line-height: 1.8;
      color: #111827;
    }
    h1 { font-size: 28px; margin-bottom: 20px; }
    .content {
      white-space: normal;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      background: #fff;
    }
  </style>
</head>
<body>
  <h1>${escapedTitle}</h1>
  <div class="content">${escapedBody}</div>
</body>
</html>`
    );
    previewWindow.document.close();
  }

  /**
   * Escape HTML special characters.
   *
   * @param {string} value - Input string.
   * @returns {string}
   */
  escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  /**
   * Export one page to DOCX.
   *
   * @param {number} pageIndex - Page index.
   * @returns {Promise<void>}
   */
  async exportSinglePage(pageIndex) {
    const page = this.pages.find((item) => item.index === pageIndex);
    if (!page) {
      this.setStatus("未找到要导出的页面。", true);
      return;
    }

    this.setStatus(`正在导出第 ${pageIndex + 1} 页 DOCX...`);

    try {
      const response = await fetch("/api/export-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: page.title,
          pages: [page]
        })
      });

      if (!response.ok) {
        const payload = await this.parseJsonResponse(response);
        throw new Error(this.getErrorMessage(payload, "导出本页 DOCX 失败"));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${page.title}.docx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      this.setStatus(`第 ${pageIndex + 1} 页 DOCX 导出完成。`);
    } catch (error) {
      this.setStatus(this.normalizeError(error), true);
    }
  }

  /**
   * Parse JSON response safely.
   *
   * @param {Response} response - Fetch response.
   * @returns {Promise<object>}
   */
  async parseJsonResponse(response) {
    const text = await response.text();
    if (!text) {
      return {};
    }

    try {
      /** @type {object} */
      const payload = JSON.parse(text);
      return payload;
    } catch {
      return { error: text };
    }
  }

  /**
   * Extract error message from payload.
   *
   * @param {object} payload - JSON payload.
   * @param {string} fallback - Fallback message.
   * @returns {string}
   */
  getErrorMessage(payload, fallback) {
    if ("error" in payload && typeof payload.error === "string") {
      return payload.error;
    }
    return fallback;
  }

  /**
   * Normalize unknown error.
   *
   * @param {unknown} error - Unknown error.
   * @returns {string}
   */
  normalizeError(error) {
    if (error instanceof Error) {
      return error.message;
    }
    return "发生未知错误。";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new PBLApp();
});