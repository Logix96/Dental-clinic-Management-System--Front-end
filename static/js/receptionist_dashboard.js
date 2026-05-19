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
  
// phân trang
class Paginator {
    constructor(tableId, wrapperId, rowsPerPage = 8) {
        this.table = document.getElementById(tableId);
        this.wrapper = document.getElementById(wrapperId);
        this.rowsPerPage = rowsPerPage;
        this.currentPage = 1;
        if(this.table && this.wrapper) this._init();
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
        const total = this.filteredRows.length;
        const totalPages = Math.max(1, Math.ceil(total / this.rowsPerPage));
        this.currentPage = Math.min(this.currentPage, totalPages);
        const start = (this.currentPage - 1) * this.rowsPerPage;
        const end = start + this.rowsPerPage;
    
        this.allRows.forEach((row) => (row.style.display = "none"));
        this.filteredRows.forEach((row, i) => { row.style.display = i >= start && i < end ? "" : "none"; });
    
        const btns = this._pageRange(this.currentPage, totalPages).map((p) =>
            p === "..." ? `<button class="page-btn" disabled>…</button>` : `<button class="page-btn ${p === this.currentPage ? "active" : ""}" data-page="${p}">${p}</button>`
        ).join("");
    
        this.wrapper.innerHTML = `
            <span class="pagination-info">${total === 0 ? "Không có dữ liệu" : `Hiển thị ${start + 1}–${Math.min(end, total)} / ${total} dòng`}</span>
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
    _pageRange(c, t) {
        if (t <= 5) return Array.from({ length: t }, (_, i) => i + 1);
        if (c <= 3) return [1, 2, 3, 4, "...", t];
        if (c >= t - 2) return [1, "...", t - 3, t - 2, t - 1, t];
        return [1, "...", c - 1, c, c + 1, "...", t];
    }
}

// filter màn 
window.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".date-render").forEach(el => { el.textContent = new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }); });

    const now = new Date();
    const todayY = String(now.getFullYear());
    const todayM = String(now.getMonth() + 1).padStart(2, '0');
    const todayD = String(now.getDate()).padStart(2, '0');
    
    const searchInput = document.getElementById("clientSearchInput");
    if(searchInput) {
        searchInput.addEventListener("input", (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll(".client-card").forEach((card) => {
                const name = (card.getAttribute("data-name") || "").toLowerCase();
                card.style.display = name.includes(q) ? "flex" : "none";
            });
        });
    }

    const pagAppt = new Paginator("apptTable", "paginationAppt", 8);

    const filterDayAppt = document.getElementById("filterDay");
    if (filterDayAppt) {
        for (let i = 1; i <= 31; i++) {
            const opt = document.createElement("option");
            opt.value = i < 10 ? "0" + i : "" + i;
            opt.textContent = "Ngày " + i;
            filterDayAppt.appendChild(opt);
        }
    }

    function applyApptFilter() {
        const s = document.getElementById("apptStatusFilter")?.value || "";
        const y = document.getElementById("filterYear")?.value     || "";
        const m = document.getElementById("filterMonth")?.value    || "";
        const d = document.getElementById("filterDay")?.value      || "";
        pagAppt.applyFilter(row => {
            const matchStatus = !s || row.getAttribute("data-status") === s;
            const parts = (row.cells[1]?.textContent.trim() || "").split("-");
            const matchDate = parts.length === 3
                ? (!y || parts[0] === y) && (!m || parts[1] === m) && (!d || parts[2] === d)
                : true;
            return matchStatus && matchDate;
        });
    }
    document.getElementById("apptStatusFilter")?.addEventListener("change", applyApptFilter);
    document.getElementById("filterYear")?.addEventListener("change",       applyApptFilter);
    document.getElementById("filterMonth")?.addEventListener("change",      applyApptFilter);
    document.getElementById("filterDay")?.addEventListener("change",        applyApptFilter);
    document.getElementById("btnResetApptFilter")?.addEventListener("click", () => {
        ["apptStatusFilter", "filterYear", "filterMonth", "filterDay"]
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
        pagAppt.applyFilter(null);
    });
    document.getElementById("btnTodayAppt")?.addEventListener("click", () => {
        document.getElementById("apptStatusFilter").value = "";
        document.getElementById("filterYear").value       = todayY;
        document.getElementById("filterMonth").value      = todayM;
        document.getElementById("filterDay").value        = todayD;
        applyApptFilter();
    });
    applyApptFilter();

    const pagInv = new Paginator("invoiceTable", "paginationInvoice", 8);

    const filterDayInv = document.getElementById("invFilterDay");
    if (filterDayInv) {
        for (let i = 1; i <= 31; i++) {
            const opt = document.createElement("option");
            opt.value = i < 10 ? "0" + i : "" + i;
            opt.textContent = "Ngày " + i;
            filterDayInv.appendChild(opt);
        }
    }

    function applyInvFilter() {
        const s = document.getElementById("invoiceStatusFilter")?.value || "";
        const y = document.getElementById("invFilterYear")?.value       || "";
        const m = document.getElementById("invFilterMonth")?.value      || "";
        const d = document.getElementById("invFilterDay")?.value        || "";
        pagInv.applyFilter(row => {
            const matchStatus = !s || row.getAttribute("data-status") === s;
            const parts = (row.getAttribute("data-date") || "").split("-");
            const matchDate = parts.length === 3
                ? (!y || parts[0] === y) && (!m || parts[1] === m) && (!d || parts[2] === d)
                : true;
            return matchStatus && matchDate;
        });
    }
    document.getElementById("invoiceStatusFilter")?.addEventListener("change", applyInvFilter);
    document.getElementById("invFilterYear")?.addEventListener("change",       applyInvFilter);
    document.getElementById("invFilterMonth")?.addEventListener("change",      applyInvFilter);
    document.getElementById("invFilterDay")?.addEventListener("change",        applyInvFilter);
    document.getElementById("btnResetInvoiceFilter")?.addEventListener("click", () => {
        ["invoiceStatusFilter", "invFilterYear", "invFilterMonth", "invFilterDay"]
            .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
        pagInv.applyFilter(null);
    });
    document.getElementById("btnTodayInv")?.addEventListener("click", () => {
        document.getElementById("invoiceStatusFilter").value = "";
        document.getElementById("invFilterYear").value       = todayY;
        document.getElementById("invFilterMonth").value      = todayM;
        document.getElementById("invFilterDay").value        = todayD;
        applyInvFilter();
    });
    applyInvFilter();
});

// thêm khách
function submitAddClient() {
    const data = {
        name: document.getElementById('addName').value, gender: document.getElementById('addGender').value,
        dob: document.getElementById('addDob').value, phone: document.getElementById('addPhone').value,
        email: document.getElementById('addEmail').value, address: document.getElementById('addAddress').value,
        pin: document.getElementById('addPin').value, username: document.getElementById('addUsername').value,
        password: document.getElementById('addPassword').value
    };
    if(!data.name || !data.dob || !data.phone || !data.username || !data.password) { alert("Vui lòng điền đủ các trường có dấu *"); return; }
    
    fetch("/receptionist_add_client", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
        if(res.status === 'success') { alert("Thêm thành công!"); window.location.reload(); } else alert("Lỗi: " + res.message);
    });
}

// sửa khách
function openEditClientModal(id, name, gender, dob, phone, email, address, pin) {
    document.getElementById("editAvatar").textContent = name[0].toUpperCase();
    document.getElementById("editHeaderName").textContent = name;
    document.getElementById("editHeaderId").textContent = "Mã KH: #" + id;
    
    const fields = { editId: id, editName: name, editGender: gender, editDob: dob, editPhone: phone, editEmail: email, editAddress: address, editPin: pin };
    for (const [k, v] of Object.entries(fields)) {
        const el = document.getElementById(k);
        el.value = v; el.setAttribute("data-orig", v);
    }
    
    const btn = document.getElementById('btnSaveEdit');
    btn.disabled = true; btn.classList.replace('btn-primary', 'btn-secondary');
    document.getElementById("editClientOverlay").classList.add("open");
}

function checkEditChanges() {
    let changed = Array.from(document.querySelectorAll('.edit-input')).some(el => el.value !== el.getAttribute('data-orig'));
    const btn = document.getElementById('btnSaveEdit');
    if (changed) { btn.disabled = false; btn.classList.replace('btn-secondary', 'btn-primary'); } 
    else { btn.disabled = true; btn.classList.replace('btn-primary', 'btn-secondary'); }
}

function submitEditClient() {
    const data = {
        client_id: document.getElementById('editId').value, name: document.getElementById('editName').value,
        gender: document.getElementById('editGender').value, dob: document.getElementById('editDob').value,
        phone: document.getElementById('editPhone').value, email: document.getElementById('editEmail').value,
        address: document.getElementById('editAddress').value, pin: document.getElementById('editPin').value
    };
    if(!data.name || !data.dob || !data.phone) { alert("Thiếu thông tin bắt buộc!"); return; }

    fetch("/receptionist_edit_client", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
        if(res.status === 'success') { alert("Sửa thành công!"); window.location.reload(); } else alert("Lỗi: " + res.message);
    });
}

// thanh toán bill
function payInvoice(id, btn) {
    if(!confirm("Xác nhận khách hàng Đã Thanh Toán cho Hóa đơn #" + id + "?")) return;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    btn.disabled = true;

    fetch("/receptionist_pay_invoice", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invoice_id: id })
    }).then(r => r.json()).then(res => {
        if(res.status === 'success') {
            btn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Đã thanh toán';
            btn.classList.replace('btn-success', 'btn-secondary');
            const badge = document.getElementById('badge-inv-' + id);
            badge.textContent = 'Đã thanh toán'; badge.className = 'badge bg-secondary';
            btn.closest('tr').setAttribute('data-status', 'Đã thanh toán');
        } else {
            alert("Lỗi: " + res.message);
            btn.innerHTML = '<i class="fas fa-check-circle me-1"></i> Xác nhận Đã thanh toán';
            btn.disabled = false;
        }
    });
}

// đổi status lịch hẹn
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