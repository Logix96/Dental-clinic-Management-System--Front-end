// chuyển tab
document.querySelectorAll(".sidebar-nav a").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    document
      .querySelectorAll(".sidebar-nav a")
      .forEach((l) => l.classList.remove("active"));
    this.classList.add("active");
    document
      .querySelectorAll(".dashboard-view")
      .forEach((v) => v.classList.remove("active-view"));
    const target = document.getElementById(this.getAttribute("data-target"));
    if (target) target.classList.add("active-view");
  });
});

// thống kê tổng quan
function loadDashboardStatistics() {
  const upcomingTable = document.getElementById("upcomingAppointmentsTable");
  const el = (id) => document.getElementById(id);

  if (el("statUpcomingCount"))
    el("statUpcomingCount").textContent = upcomingTable
      ? upcomingTable.querySelectorAll("tbody tr[class]").length
      : 0;

  const treatmentTable = document.getElementById("currentTreatmentsTable");
  if (el("statTreatmentCount"))
    el("statTreatmentCount").textContent = treatmentTable
      ? treatmentTable.querySelectorAll("tbody tr").length
      : 0;

  let unpaidSum = 0;

  document.querySelectorAll("#unpaidTable .unpaid-cell").forEach((cell) => {
    unpaidSum += parseFloat(cell.dataset.amount) || 0;
  });

  if (el("statUnpaidFee")) {
    el("statUnpaidFee").textContent = unpaidSum.toLocaleString("vi-VN") + " đ";
  }
}

// phân trang
class Paginator {
  constructor(tableId, wrapperId, rowsPerPage = 8) {
    this.table = document.getElementById(tableId);
    this.wrapper = document.getElementById(wrapperId);
    this.rowsPerPage = rowsPerPage;
    this.currentPage = 1;
    
    this.allRows = [];
    this.filteredRows = [];
    if (this.table && this.wrapper) this._init();
  }

  _init() {
    this.allRows = Array.from(this.table.querySelectorAll("tbody tr"));
    this.filteredRows = [...this.allRows];
    this._render();
  }

  applyFilter(predicate) {
    this.filteredRows = predicate
      ? this.allRows.filter(predicate)
      : [...this.allRows];
    this.currentPage = 1;
    this._render();
  }

  _render() {
    const total = this.filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(total / this.rowsPerPage));
    this.currentPage = Math.min(this.currentPage, totalPages);

    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;

    this.allRows.forEach((row) => (row.style.display = "none"));
    this.filteredRows.forEach((row, i) => {
      row.style.display = i >= start && i < end ? "" : "none";
    });

    const infoText =
      total === 0
        ? "Không có dữ liệu"
        : `Hiển thị ${start + 1}–${Math.min(end, total)} / ${total} dòng`;

    const pages = this._pageRange(this.currentPage, totalPages);
    const btns = pages
      .map((p) =>
        p === "..."
          ? `<button class="page-btn" disabled>…</button>`
          : `<button class="page-btn ${p === this.currentPage ? "active" : ""}"
               data-page="${p}">${p}</button>`,
      )
      .join("");

    this.wrapper.innerHTML = `
      <span class="pagination-info">${infoText}</span>
      <div class="pagination-controls">
        <button class="page-btn" id="prev-${this.table.id}" ${this.currentPage === 1 ? "disabled" : ""}>
          <i class="fas fa-chevron-left"></i>
        </button>
        ${btns}
        <button class="page-btn" id="next-${this.table.id}" ${this.currentPage === totalPages ? "disabled" : ""}>
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>`;

    this.wrapper.querySelectorAll(".page-btn[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.currentPage = parseInt(btn.getAttribute("data-page"));
        this._render();
      });
    });
    const prev = this.wrapper.querySelector(`#prev-${this.table.id}`);
    const next = this.wrapper.querySelector(`#next-${this.table.id}`);
    if (prev)
      prev.addEventListener("click", () => {
        this.currentPage--;
        this._render();
      });
    if (next)
      next.addEventListener("click", () => {
        this.currentPage++;
        this._render();
      });
  }

  _pageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (current >= total - 3)
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
  }
}

// filter lịch hẹn (năm/tháng/ngày/trạng thái)
function initApptFilter() {
  const filterDayEl = document.getElementById("filterDay");
  if (filterDayEl) {
    for (let i = 1; i <= 31; i++) {
      let dayStr = i < 10 ? "0" + i : "" + i;
      let option = document.createElement("option");
      option.value = dayStr;
      option.textContent = "Ngày " + i;
      filterDayEl.appendChild(option);
    }
  }

  const pagAppt = new Paginator("apptTable", "paginationAppt", 8);

  function applyApptFilter() {
    const s = document.getElementById("apptStatusFilter")?.value;
    const y = document.getElementById("filterYear")?.value;
    const m = document.getElementById("filterMonth")?.value;
    const d = document.getElementById("filterDay")?.value;

    pagAppt.applyFilter((row) => {
      const ms = !s || row.getAttribute("data-status") === s;

      let md = true;
      const dateMatch = row.innerHTML.match(/\d{4}-\d{2}-\d{2}/);

      if (dateMatch) {
        const parts = dateMatch[0].split("-");
        const matchY = !y || parts[0] === y;
        const matchM = !m || parts[1] === m;
        const matchDay = !d || parts[2] === d;
        md = matchY && matchM && matchDay;
      }

      return ms && md;
    });
  }

  document
    .getElementById("apptStatusFilter")
    ?.addEventListener("change", applyApptFilter);
  document
    .getElementById("filterYear")
    ?.addEventListener("change", applyApptFilter);
  document
    .getElementById("filterMonth")
    ?.addEventListener("change", applyApptFilter);
  document
    .getElementById("filterDay")
    ?.addEventListener("change", applyApptFilter);

  // 4. SỰ KIỆN NÚT ĐẶT LẠI
  document.getElementById("btnResetApptFilter")?.addEventListener("click", () => {
    if (document.getElementById("apptStatusFilter"))
      document.getElementById("apptStatusFilter").value = "";
    if (document.getElementById("filterYear"))
      document.getElementById("filterYear").value = "";
    if (document.getElementById("filterMonth"))
      document.getElementById("filterMonth").value = "";
    if (document.getElementById("filterDay"))
      document.getElementById("filterDay").value = "";
    applyApptFilter();
  });

  // khởi chạy lọc lần đầu khi load trang
  applyApptFilter();
}

// modal hoá đơn
function initInvoiceModal() {
  const overlay = document.getElementById("invoiceOverlay");
  const closeBtn = document.getElementById("invoiceModalClose");
  if (!overlay) return;

  function fmt(num) {
    const n = parseFloat(num);
    return isNaN(n) ? "—" : n.toLocaleString("vi-VN") + " đ";
  }

  function openModal(row) {
    const d = row.dataset;
    document.getElementById("modalTreatmentName").textContent =
      d.treatment || "—";
    document.getElementById("modalInvoiceId").textContent =
      "#" + (d.invoiceId || "—");
    document.getElementById("modalApptId").textContent = "#" + (d.appt || "—");
    document.getElementById("modalDate").textContent = d.date || "—";
    document.getElementById("modalTotal").textContent = fmt(d.total);
    document.getElementById("modalDiscount").textContent =
      parseFloat(d.discount) > 0 ? "- " + fmt(d.discount) : "Không có";
    document.getElementById("modalMethod").textContent = d.method || "—";

    const statusEl = document.getElementById("modalStatus");
    statusEl.innerHTML =
      d.status === "Đã thanh toán"
        ? `<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>${d.status}</span>`
        : `<span class="badge bg-warning text-dark">${d.status}</span>`;

    document.getElementById("modalFinal").textContent = fmt(d.final);
    overlay.classList.add("open");
  }

  document.querySelectorAll(".clickable-row").forEach((row) => {
    row.addEventListener("click", () => openModal(row));
  });

  closeBtn?.addEventListener("click", () => overlay.classList.remove("open"));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.classList.remove("open");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") overlay.classList.remove("open");
  });
}

// sort bảng
function sortTable(columnIndex, tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll("tr"));
  const attr = "data-sort-dir-" + columnIndex;
  const currentDir = table.getAttribute(attr) || "desc";
  const nextDir = currentDir === "asc" ? "desc" : "asc";

  rows.sort((a, b) => {
    const ca = a.cells[columnIndex]?.textContent.trim() || "";
    const cb = b.cells[columnIndex]?.textContent.trim() || "";
    const na = parseFloat(ca.replace(/[đ,. ]/g, ""));
    const nb = parseFloat(cb.replace(/[đ,. ]/g, ""));
    if (!isNaN(na) && !isNaN(nb)) return nextDir === "asc" ? na - nb : nb - na;
    return nextDir === "asc"
      ? ca.localeCompare(cb, "vi")
      : cb.localeCompare(ca, "vi");
  });

  table.setAttribute(attr, nextDir);
  rows.forEach((r) => tbody.appendChild(r));
}

// load
window.addEventListener("DOMContentLoaded", () => {
  const opts = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  document.querySelectorAll(".date-render").forEach((el) => {
    el.textContent = new Date().toLocaleDateString("vi-VN", opts);
  });

  const paginators = {
    overview: new Paginator("overviewApptTable", "paginationOverview", 5),
    upcoming: new Paginator(
      "upcomingAppointmentsTable",
      "paginationUpcoming",
      8,
    ),
    treatments: new Paginator(
      "currentTreatmentsTable",
      "paginationTreatments",
      8,
    ),
    unpaid: new Paginator("unpaidTable", "paginationUnpaid", 8),
    paid: new Paginator("paidTable", "paginationPaid", 8),
  };

  initApptFilter();

  initInvoiceModal();

  loadDashboardStatistics();
});