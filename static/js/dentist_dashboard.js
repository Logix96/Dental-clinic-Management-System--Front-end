// chuyển tab
document.querySelectorAll(".sidebar-nav a").forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelectorAll(".sidebar-nav a").forEach((l) => l.classList.remove("active"));
    this.classList.add("active");
    document.querySelectorAll(".dashboard-view").forEach((v) => v.classList.remove("active-view"));
    const target = document.getElementById(this.getAttribute("data-target"));
    if (target) target.classList.add("active-view");
  });
});

// chuyển sub view liệu trình
function switchTreatmentView(targetId) {
  document.querySelectorAll(".sub-view-container .sub-view").forEach((v) => v.classList.remove("active-view"));
  const el = document.getElementById(targetId);
  if (el) el.classList.add("active-view");
}

// giỏ dịch vụ
let cart = [];

function addServiceItem() {
  const select  = document.getElementById("tmpService");
  const srv_id  = select.value;
  const srv_name = select.options[select.selectedIndex].text;
  const price   = parseFloat(select.options[select.selectedIndex].getAttribute("data-price") || 0);
  const tooth   = document.getElementById("tmpTooth").value.trim();
  const qty     = parseInt(document.getElementById("tmpQty").value) || 1;

  if (!tooth) { alert("Vui lòng nhập răng số!"); return; }

  cart.push({ procedure_id: srv_id, srv_name: srv_name, tooth: tooth, amount: qty, price: price, id: Date.now() });
  renderCart();
  document.getElementById("tmpTooth").value = "";
  document.getElementById("tmpQty").value   = "1";
}

function removeServiceItem(id) {
  cart = cart.filter((item) => item.id !== id);
  renderCart();
}

function renderCart() {
  const container = document.getElementById("serviceCartRender");
  const totalEl   = document.getElementById("cartTotal");

  if (cart.length === 0) {
    container.innerHTML = `<div class="p-3 text-muted text-center"><i class="fas fa-cart-plus me-2"></i>Chưa có dịch vụ nào được thêm.</div>`;
    if (totalEl) totalEl.textContent = "0 đ";
    return;
  }

  let grandTotal = 0;
  container.innerHTML = cart.map((item) => {
    const lineTotal = item.price * item.amount;
    grandTotal += lineTotal;
    return `
      <div class="service-item">
        <div>
          <strong>${item.srv_name}</strong>
          <span class="text-muted" style="font-size:0.82rem"> | Răng: ${item.tooth} | SL: ${item.amount} | ${lineTotal.toLocaleString("vi-VN")}đ</span>
        </div>
        <i class="fas fa-times btn-remove" onclick="removeServiceItem(${item.id})"></i>
      </div>`;
  }).join("");

  if (totalEl) totalEl.textContent = grandTotal.toLocaleString("vi-VN") + " đ";
}

// gửi liệu trình về backend
function submitTreatmentPlan() {
  if (cart.length === 0) { alert("Cần chọn ít nhất 1 dịch vụ!"); return; }

  const title = document.getElementById("formTitle").value.trim();
  if (!title) { alert("Vui lòng nhập chủ đề liệu trình!"); return; }

  const payload = {
    client_id:      document.getElementById("formClientId").value,   
    appointment_id: document.getElementById("formApptId").value,
    title:          title,
    description:    document.getElementById("formDesc").value,
    services:       cart.map(({ procedure_id, tooth, amount }) => ({ procedure_id, tooth, amount })),
  };

  const btn = document.querySelector("#subview-treatment-add .btn-success");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang xử lý...'; }

  fetch("/dentist_add_treatment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Tạo liệu trình thành công!");
        cart = [];
        window.location.reload();
      } else {
        alert("Lỗi: " + data.message);
      }
    })
    .catch(() => alert("Lỗi kết nối tới Server!"))
    .finally(() => {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle me-2"></i>TẠO LIỆU TRÌNH'; }
    });
}

// phân page
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
    this.filteredRows = predicate ? this.allRows.filter(predicate) : [...this.allRows];
    this.currentPage = 1;
    this._render();
  }

  _render() {
    const total      = this.filteredRows.length;
    const totalPages = Math.max(1, Math.ceil(total / this.rowsPerPage));
    this.currentPage = Math.min(this.currentPage, totalPages);
    const start      = (this.currentPage - 1) * this.rowsPerPage;
    const end        = start + this.rowsPerPage;

    this.allRows.forEach((row) => (row.style.display = "none"));
    this.filteredRows.forEach((row, i) => {
      row.style.display = i >= start && i < end ? "" : "none";
    });

    const infoText = total === 0
      ? "Không có dữ liệu"
      : `Hiển thị ${start + 1}–${Math.min(end, total)} / ${total} dòng`;

    const pages = this._pageRange(this.currentPage, totalPages);
    const btns  = pages.map((p) =>
      p === "..."
        ? `<button class="page-btn" disabled>…</button>`
        : `<button class="page-btn ${p === this.currentPage ? "active" : ""}" data-page="${p}">${p}</button>`
    ).join("");

    this.wrapper.innerHTML = `
      <span class="pagination-info">${infoText}</span>
      <div class="pagination-controls">
        <button class="page-btn" id="prev-${this.table.id}" ${this.currentPage === 1 ? "disabled" : ""}><i class="fas fa-chevron-left"></i></button>
        ${btns}
        <button class="page-btn" id="next-${this.table.id}" ${this.currentPage === totalPages ? "disabled" : ""}><i class="fas fa-chevron-right"></i></button>
      </div>`;

    this.wrapper.querySelectorAll(".page-btn[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => { this.currentPage = parseInt(btn.getAttribute("data-page")); this._render(); });
    });
    const prev = this.wrapper.querySelector(`#prev-${this.table.id}`);
    const next = this.wrapper.querySelector(`#next-${this.table.id}`);
    if (prev) prev.addEventListener("click", () => { this.currentPage--; this._render(); });
    if (next) next.addEventListener("click", () => { this.currentPage++; this._render(); });
  }

  _pageRange(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
    if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
  }
}

// sort bảng
function sortDentistTable(columnIndex, tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const tbody = table.querySelector("tbody");
  if (!tbody) return;
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const attr = "data-sort-dir-" + columnIndex;
  const nextDir = (table.getAttribute(attr) || "desc") === "asc" ? "desc" : "asc";

  rows.sort((a, b) => {
    const ca = a.cells[columnIndex]?.textContent.trim() || "";
    const cb = b.cells[columnIndex]?.textContent.trim() || "";
    const na = parseFloat(ca.replace(/[đ,. ]/g, ""));
    const nb = parseFloat(cb.replace(/[đ,. ]/g, ""));
    if (!isNaN(na) && !isNaN(nb)) return nextDir === "asc" ? na - nb : nb - na;
    return nextDir === "asc" ? ca.localeCompare(cb, "vi") : cb.localeCompare(ca, "vi");
  });

  table.setAttribute(attr, nextDir);
  rows.forEach((r) => tbody.appendChild(r));
}

// tìm khách
function initclientSearch() {
  const input = document.getElementById("clientSearchInput");
  if (!input) return;
  input.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".client-card").forEach((card) => {
      const name = (card.getAttribute("data-name") || "").toLowerCase();
      card.style.display = name.includes(q) ? "flex" : "none";
    });
  });
}

// model khách hàng
function openclientModal(id, name, gender, dob, phone, email, address, pin) {
  document.getElementById("modalclientAvatar").textContent = (name || "?")[0].toUpperCase();
  document.getElementById("modalclientName").textContent   = name || "—";
  document.getElementById("modalclientId").textContent     = "Mã BN: #" + id;
  document.getElementById("modalclientGender").textContent = gender === "M" ? "Nam" : "Nữ";
  document.getElementById("modalclientDob").textContent    = dob || "—";
  document.getElementById("modalclientPhone").textContent  = phone || "—";
  document.getElementById("modalclientEmail").textContent  = email || "—";
  document.getElementById("modalclientAddr").textContent   = address || "—";
  document.getElementById("modalclientPin").textContent    = pin || "—";
  document.getElementById("clientDetailOverlay").classList.add("open");
}

function initclientModal() {
  const overlay = document.getElementById("clientDetailOverlay");
  if (!overlay) return;
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.remove("open"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") overlay.classList.remove("open"); });
}

// filter lịch hẹn
function initApptFilter(paginator) {
  const statusSel = document.getElementById("apptStatusFilter");
  const yearSel   = document.getElementById("filterYear");
  const monthSel  = document.getElementById("filterMonth");
  const dayEl     = document.getElementById("filterDay");
  const resetBtn  = document.getElementById("btnResetApptFilter");
  if (!statusSel) return;

  if (dayEl) {
    for (let i = 1; i <= 31; i++) {
      const dayStr = i < 10 ? "0" + i : "" + i;
      const opt = document.createElement("option");
      opt.value = dayStr;
      opt.textContent = "Ngày " + i;
      dayEl.appendChild(opt);
    }
  }

  function applyFilters() {
    const status = statusSel?.value || "";
    const y = yearSel?.value  || "";
    const m = monthSel?.value || "";
    const d = dayEl?.value    || "";

    paginator.applyFilter((row) => {
      const matchStatus = !status || (row.getAttribute("data-status") || "") === status;

      let matchDate = true;
      const parts = (row.cells[1]?.textContent.trim() || "").split("-");
      if (parts.length === 3) {
        const matchY = !y || parts[0] === y;
        const matchM = !m || parts[1] === m;
        const matchD = !d || parts[2] === d;
        matchDate = matchY && matchM && matchD;
      }

      return matchStatus && matchDate;
    });
  }

  statusSel?.addEventListener("change", applyFilters);
  yearSel?.addEventListener("change",   applyFilters);
  monthSel?.addEventListener("change",  applyFilters);
  dayEl?.addEventListener("change",     applyFilters);

  resetBtn?.addEventListener("click", () => {
    if (statusSel) statusSel.value = "";
    if (yearSel)   yearSel.value   = "";
    if (monthSel)  monthSel.value  = "";
    if (dayEl)     dayEl.value     = "";
    paginator.applyFilter(null);
  });

  const todayBtn = document.getElementById("btnTodayAppt");
  if (todayBtn) {
    const now = new Date();
    const todayY = String(now.getFullYear());
    const todayM = String(now.getMonth() + 1).padStart(2, "0");
    const todayD = String(now.getDate()).padStart(2, "0");
    todayBtn.addEventListener("click", () => {
      if (statusSel) statusSel.value = "";
      if (yearSel)   yearSel.value   = todayY;
      if (monthSel)  monthSel.value  = todayM;
      if (dayEl)     dayEl.value     = todayD;
      applyFilters();
    });
  }

  applyFilters();
}

// thống kê tổng
function loadStats() {
  const todayRows = document.querySelectorAll(".appt-row.is-today");
  const elToday   = document.getElementById("statTodayCount");
  if (elToday) elToday.textContent = todayRows.length;

  const clientCards = document.querySelectorAll(".client-card");
  const elClients   = document.getElementById("statClientCount");
  if (elClients) elClients.textContent = clientCards.length;

  const treatRows    = document.querySelectorAll("#treatmentTable tbody tr");
  const elTreatments = document.getElementById("statTreatmentCount");
  if (elTreatments) elTreatments.textContent = treatRows.length;
}

// start
window.addEventListener("DOMContentLoaded", () => {

  const opts = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  document.querySelectorAll(".date-render").forEach((el) => {
    el.textContent = new Date().toLocaleDateString("vi-VN", opts);
  });

  const paginators = {
    appt:       new Paginator("apptTable",      "paginationAppt",       8),
    treatments: new Paginator("treatmentTable", "paginationTreatments", 8),
  };

  initApptFilter(paginators.appt);

  initclientSearch();

  initclientModal();

  loadStats();
  filterApptByClient();

  const editOverlay = document.getElementById("editTreatmentOverlay");
  if (editOverlay) {
    editOverlay.addEventListener("click", (e) => { if (e.target === editOverlay) editOverlay.classList.remove("open"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") editOverlay.classList.remove("open"); });
  }
});

// lọc lịch theo khách
function filterApptByClient() {
  const clientSel = document.getElementById("formClientId");
  const apptSel   = document.getElementById("formApptId");
  if (!clientSel || !apptSel) return;

  const selectedClientId = clientSel.value;
  let firstVisible = null;

  Array.from(apptSel.options).forEach((opt) => {
    const match = opt.getAttribute("data-client") === selectedClientId;
    opt.hidden   = !match;
    opt.disabled = !match;
    if (match && !firstVisible) firstVisible = opt;
  });

  if (firstVisible) apptSel.value = firstVisible.value;
}

// sửa liệu trình
function openEditTreatmentModal(treatmentId, title, description) {
  document.getElementById("editTreatmentId").value    = treatmentId;
  document.getElementById("editTreatmentTitle").value = title;
  document.getElementById("editTreatmentDesc").value  = description;
  document.getElementById("editTreatmentOverlay").classList.add("open");
}

function submitEditTreatment() {
  const treatmentId = document.getElementById("editTreatmentId").value;
  const title       = document.getElementById("editTreatmentTitle").value.trim();
  const description = document.getElementById("editTreatmentDesc").value;

  if (!title) { alert("Vui lòng nhập chủ đề liệu trình!"); return; }

  const btn = document.querySelector("#editTreatmentOverlay .btn-primary");
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang lưu...'; }

  fetch("/dentist_edit_treatment", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ treatment_id: treatmentId, title, description }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Cập nhật thành công!");
        window.location.reload();
      } else {
        alert("Lỗi: " + data.message);
      }
    })
    .catch(() => alert("Lỗi kết nối tới Server!"))
    .finally(() => {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save me-2"></i>Lưu Thay Đổi'; }
    });
}

// xoá liêu trình
function deleteTreatment(treatmentId, iconEl) {
  if (!confirm("Bạn có chắc muốn xoá liệu trình này? Hành động không thể hoàn tác!")) return;

  fetch(`/dentist_delete_treatment/${treatmentId}`, { method: "DELETE" })
    .then((res) => res.json())
    .then((data) => {
      if (data.status === "success") {
        const row = iconEl.closest("tr");
        if (row) row.remove();
        const statEl = document.getElementById("statTreatmentCount");
        if (statEl) statEl.textContent = Math.max(0, parseInt(statEl.textContent) - 1);
      } else {
        alert("Lỗi: " + data.message);
      }
    })
    .catch(() => alert("Lỗi kết nối tới Server!"));
}

// đổi trạng thái lịch hẹn
let currentStatusBtn = null; 

function openStatusModal(apptId, role, btnElement) {
    document.getElementById('modalApptId').value = apptId;
    document.getElementById('modalApptRole').value = role;
    currentStatusBtn = btnElement; 
    document.getElementById('statusModalOverlay').classList.add('open');
}

function submitStatusChange(newStatus) {
    const apptId = document.getElementById('modalApptId').value;
    const role = document.getElementById('modalApptRole').value;
    const endpoint = role === 'dentist' ? '/dentist_update_appt_status' : '/receptionist_update_appt_status';

    document.getElementById('statusModalOverlay').classList.remove('open');

    if(currentStatusBtn) {
        currentStatusBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        currentStatusBtn.disabled = true;
    }

    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: apptId, status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        if(currentStatusBtn) currentStatusBtn.disabled = false;
        
        if(data.status === 'success') {
            currentStatusBtn.innerHTML = newStatus + ' <i class="fas fa-edit ms-1" style="font-size: 0.75rem; opacity: 0.8;"></i>';
            
            currentStatusBtn.className = 'btn btn-sm fw-bold shadow-sm ' + getBsStatusColor(newStatus);
            
            const row = currentStatusBtn.closest('tr');
            if(row) row.setAttribute('data-status', newStatus);

        } else {
            alert("Lỗi: " + data.message);
            window.location.reload();
        }
    })
    .catch(err => {
        alert("Lỗi kết nối Server!");
        window.location.reload();
    });
}

function getBsStatusColor(status) {
    if(status === 'Đã khám') return 'bg-success text-white';
    if(status === 'Đã đặt lịch') return 'bg-warning text-dark';
    if(status === 'Vắng mặt') return 'bg-secondary text-white';
    return 'bg-danger text-white'; 
}