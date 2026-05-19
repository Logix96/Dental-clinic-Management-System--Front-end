// chuyển Tab Sidebar
document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.dashboard-view').forEach(view => view.classList.remove('active-view'));
        document.getElementById(this.getAttribute('data-target')).classList.add('active-view');
    });
});

// Pagination Class
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

// init + filters
window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.date-render').forEach(el => el.textContent = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = String(now.getMonth() + 1).padStart(2, '0');
    const todayD = String(now.getDate()).padStart(2, '0');

    // ---- helper: populate day selects ----
    function populateDays(selectId) {
        const sel = document.getElementById(selectId);
        if (!sel) return;
        for (let i = 1; i <= 31; i++) {
            const v = i < 10 ? '0' + i : '' + i;
            const opt = document.createElement('option');
            opt.value = v; opt.textContent = 'Ngày ' + i;
            sel.appendChild(opt);
        }
    }
    populateDays('apptFilterDay');
    populateDays('revFilterDay');

    // ---- helper: populate year selects from table rows ----
    function populateYears(selectId, rowSelector, useDateAttr) {
        const sel = document.getElementById(selectId);
        if (!sel) return;
        const years = new Set();
        document.querySelectorAll(rowSelector).forEach(row => {
            if (useDateAttr) {
                const dateAttr = row.getAttribute('data-date') || "";
                const parts = dateAttr.split('-');
                if (parts.length === 3) years.add(parts[0]);
            } else {
                const cell = row.cells[1];
                if (cell) {
                    const parts = cell.textContent.trim().split('-');
                    if (parts.length === 3) years.add(parts[0]);
                }
            }
        });
        [...years].sort().forEach(y => {
            const opt = document.createElement('option');
            opt.value = y; opt.textContent = 'Năm ' + y;
            sel.appendChild(opt);
        });
    }
    populateYears('apptFilterYear', '#apptTable tbody tr', false);
    populateYears('revFilterYear',  '.rev-row', true);

    // ---- lịch hẹn filter ----
    const pagAppt = new Paginator("apptTable", "paginationAppt", 8);

    function applyApptFilter() {
        const status = document.getElementById("apptStatusFilter")?.value || "";
        const y = document.getElementById("apptFilterYear")?.value  || "";
        const m = document.getElementById("apptFilterMonth")?.value || "";
        const d = document.getElementById("apptFilterDay")?.value   || "";
        pagAppt.applyFilter(row => {
            const matchStatus = !status || row.getAttribute("data-status") === status;
            const cell = row.cells[1];
            let matchDate = true;
            if (cell) {
                const parts = cell.textContent.trim().split('-');
                if (parts.length === 3) {
                    matchDate = (!y || parts[0] === y) && (!m || parts[1] === m) && (!d || parts[2] === d);
                }
            }
            return matchStatus && matchDate;
        });
    }

    document.getElementById("apptStatusFilter")?.addEventListener("change", applyApptFilter);
    document.getElementById("apptFilterYear")?.addEventListener("change",   applyApptFilter);
    document.getElementById("apptFilterMonth")?.addEventListener("change",  applyApptFilter);
    document.getElementById("apptFilterDay")?.addEventListener("change",    applyApptFilter);

    document.getElementById("btnResetApptFilter")?.addEventListener("click", () => {
        document.getElementById("apptStatusFilter").value = "";
        document.getElementById("apptFilterYear").value   = "";
        document.getElementById("apptFilterMonth").value  = "";
        document.getElementById("apptFilterDay").value    = "";
        applyApptFilter();
    });

    document.getElementById("btnTodayAppt")?.addEventListener("click", () => {
        document.getElementById("apptStatusFilter").value = "";
        document.getElementById("apptFilterYear").value   = todayY;
        document.getElementById("apptFilterMonth").value  = todayM;
        document.getElementById("apptFilterDay").value    = todayD;
        applyApptFilter();
    });

    // mặc định hiện hôm nay khi vào
    document.getElementById("apptFilterYear").value  = todayY;
    document.getElementById("apptFilterMonth").value = todayM;
    document.getElementById("apptFilterDay").value   = todayD;
    applyApptFilter();

    // ---- doanh thu filter ----
    function applyRevFilter() {
        const y = document.getElementById("revFilterYear")?.value  || "";
        const m = document.getElementById("revFilterMonth")?.value || "";
        const d = document.getElementById("revFilterDay")?.value   || "";
        document.querySelectorAll('.rev-row').forEach(row => {
            let show = true;
            if (y || m || d) {
                const dateAttr = row.getAttribute('data-date') || "";
                const parts = dateAttr.split('-');
                if (parts.length === 3) {
                    show = (!y || parts[0] === y) && (!m || parts[1] === m) && (!d || parts[2] === d);
                } else if (dateAttr === "") {
                    // nếu không có data-date, dùng class is-today
                    const isToday = row.classList.contains('is-today');
                    const now2 = new Date();
                    const ty = String(now2.getFullYear());
                    const tm = String(now2.getMonth() + 1).padStart(2, '0');
                    const td = String(now2.getDate()).padStart(2, '0');
                    show = (!y || y === ty) && (!m || m === tm) && (!d || d === td) ? isToday : false;
                } else {
                    show = false;
                }
            }
            row.style.display = show ? 'table-row' : 'none';
        });
    }

    document.getElementById("revFilterYear")?.addEventListener("change",  applyRevFilter);
    document.getElementById("revFilterMonth")?.addEventListener("change", applyRevFilter);
    document.getElementById("revFilterDay")?.addEventListener("change",   applyRevFilter);

    document.getElementById("btnResetRevFilter")?.addEventListener("click", () => {
        document.getElementById("revFilterYear").value  = "";
        document.getElementById("revFilterMonth").value = "";
        document.getElementById("revFilterDay").value   = "";
        applyRevFilter();
    });

    document.getElementById("btnTodayRev")?.addEventListener("click", () => {
        document.getElementById("revFilterYear").value  = todayY;
        document.getElementById("revFilterMonth").value = todayM;
        document.getElementById("revFilterDay").value   = todayD;
        applyRevFilter();
    });

    // mặc định hiện hôm nay khi vào
    document.getElementById("revFilterYear").value  = todayY;
    document.getElementById("revFilterMonth").value = todayM;
    document.getElementById("revFilterDay").value   = todayD;
    applyRevFilter();

    // ---- grid search ----
    function setupGridSearch(inputId, itemClass) {
        const input = document.getElementById(inputId);
        if(!input) return;
        input.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll(`.${itemClass}`).forEach(card => {
                const name = card.getAttribute('data-name');
                card.style.display = name.includes(query) ? 'flex' : 'none';
            });
        });
    }
    setupGridSearch('clientSearchInput', 'client-card');
    setupGridSearch('empSearchInput', 'emp-card');
    setupGridSearch('srvSearchInput', 'srv-card');
});

// cập nhật trạng thái lịch hẹn
let currentApptBtn = null;
function openStatusModal(apptId, role, btnEl) {
    document.getElementById('modalApptId').value = apptId;
    currentApptBtn = btnEl;
    document.getElementById('statusModalOverlay').classList.add('open');
}
function submitStatusChange(newStatus) {
    const apptId = document.getElementById('modalApptId').value;
    document.getElementById('statusModalOverlay').classList.remove('open');
    if(currentApptBtn) currentApptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    fetch('/admin_update_appt_status', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: apptId, status: newStatus })
    }).then(r => r.json()).then(res => {
        if(res.status === 'success') {
            currentApptBtn.innerHTML = newStatus + ' <i class="fas fa-edit ms-1" style="font-size: 0.75rem; opacity: 0.8;"></i>';
            currentApptBtn.className = 'btn btn-sm fw-bold shadow-sm ' + (newStatus==='Đã khám'?'bg-success text-white':newStatus==='Đã đặt lịch'?'bg-warning text-dark':newStatus==='Vắng mặt'?'bg-secondary text-white':'bg-danger text-white');
            currentApptBtn.closest('tr').setAttribute('data-status', newStatus);
        } else { alert("Lỗi: " + res.message); window.location.reload(); }
    });
}

// sửa + khóa khách hàng
function openEditClientModal(id, name, gender, dob, phone, email, address, pin, username) {
    document.getElementById('editAvatar').textContent = name[0].toUpperCase();
    document.getElementById('editHeaderName').textContent = name;
    document.getElementById('editHeaderId').textContent = "Mã KH: #" + id;
    
    const fields = { editId: id, editName: name, editGender: gender, editDob: dob, editPhone: phone, editEmail: email, editAddress: address, editPin: pin, editUser: username, editPass: '' };
    for (const [k, v] of Object.entries(fields)) {
        const el = document.getElementById(k);
        el.value = v; el.setAttribute("data-orig", v);
    }
    document.getElementById('btnSaveClient').disabled = true;
    document.getElementById('btnSaveClient').classList.replace('btn-primary', 'btn-secondary');
    document.getElementById('editClientOverlay').classList.add('open');
}
function checkClientEdit() {
    let changed = Array.from(document.querySelectorAll('.edit-input')).some(el => el.value !== el.getAttribute('data-orig'));
    const btn = document.getElementById('btnSaveClient');
    if (changed) { btn.disabled = false; btn.classList.replace('btn-secondary', 'btn-primary'); } 
    else { btn.disabled = true; btn.classList.replace('btn-primary', 'btn-secondary'); }
}
function submitEditClient() {
    const data = {
        client_id: document.getElementById('editId').value, name: document.getElementById('editName').value,
        gender: document.getElementById('editGender').value, dob: document.getElementById('editDob').value,
        phone: document.getElementById('editPhone').value, email: document.getElementById('editEmail').value,
        address: document.getElementById('editAddress').value, pin: document.getElementById('editPin').value,
        username: document.getElementById('editUser').value, password: document.getElementById('editPass').value
    };
    fetch("/admin_edit_client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    .then(r => r.json()).then(res => { if(res.status === 'success') { alert("Đã lưu thông tin!"); window.location.reload(); } else alert("Lỗi: " + res.message); });
}
function lockClient() {
    if(!confirm("Hành động này sẽ Xóa tài khoản đăng nhập của Khách hàng, khiến họ không thể truy cập hệ thống. Các lịch sử khám vẫn được giữ nguyên. Xác nhận?")) return;
    fetch("/admin_lock_client", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: document.getElementById('editId').value }) })
    .then(r => r.json()).then(res => { if(res.status === 'success') { alert("Đã khóa quyền truy cập!"); window.location.reload(); } else alert("Lỗi: " + res.message); });
}

// sửa + khóa NV
function openEditEmpModal(id, name, gender, dob, phone, email, address, pin, salary, username) {
    const fields = { empId: id, empName: name, empGender: gender, empDob: dob, empPhone: phone, empEmail: email, empAddress: address, empPin: pin, empSalary: salary, empUser: username, empPass: '' };
    for (const [k, v] of Object.entries(fields)) { const el = document.getElementById(k); el.value = v; el.setAttribute("data-orig", v); }
    document.getElementById('btnSaveEmp').disabled = true; document.getElementById('btnSaveEmp').classList.replace('btn-primary', 'btn-secondary');
    document.getElementById('editEmpOverlay').classList.add('open');
}
function checkEmpEdit() {
    let changed = Array.from(document.querySelectorAll('.edit-input-emp')).some(el => el.value !== el.getAttribute('data-orig'));
    const btn = document.getElementById('btnSaveEmp');
    if (changed) { btn.disabled = false; btn.classList.replace('btn-secondary', 'btn-primary'); } 
    else { btn.disabled = true; btn.classList.replace('btn-primary', 'btn-secondary'); }
}
function submitEditEmployee() {
    const data = {
        employee_id: document.getElementById('empId').value, name: document.getElementById('empName').value, gender: document.getElementById('empGender').value,
        dob: document.getElementById('empDob').value, phone: document.getElementById('empPhone').value, email: document.getElementById('empEmail').value,
        address: document.getElementById('empAddress').value, pin: document.getElementById('empPin').value, salary: document.getElementById('empSalary').value,
        username: document.getElementById('empUser').value, password: document.getElementById('empPass').value
    };
    fetch("/admin_edit_employee", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    .then(r => r.json()).then(res => { if(res.status === 'success') { alert("Đã lưu thông tin!"); window.location.reload(); } else alert("Lỗi: " + res.message); });
}
function lockEmployee() {
    if(!confirm("Xác nhận Khóa tài khoản của nhân viên này?")) return;
    fetch("/admin_lock_employee", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employee_id: document.getElementById('empId').value }) })
    .then(r => r.json()).then(res => { if(res.status === 'success') { alert("Đã khóa!"); window.location.reload(); } else alert("Lỗi: " + res.message); });
}

// thêm+sửa+xoá dv
function openAddServiceModal() {
    document.getElementById('srvModalTitle').innerHTML = '<i class="fas fa-plus me-2 text-primary"></i>Thêm Dịch Vụ';
    document.getElementById('srvId').value = ''; document.getElementById('srvName').value = ''; document.getElementById('srvPrice').value = '';
    document.getElementById('srvModalOverlay').classList.add('open');
}
function openEditServiceModal(id, name, price) {
    document.getElementById('srvModalTitle').innerHTML = '<i class="fas fa-edit me-2 text-primary"></i>Sửa Dịch Vụ';
    document.getElementById('srvId').value = id; document.getElementById('srvName').value = name; document.getElementById('srvPrice').value = price;
    document.getElementById('srvModalOverlay').classList.add('open');
}
function submitService() {
    const id = document.getElementById('srvId').value;
    const data = { id: id, name: document.getElementById('srvName').value, price: document.getElementById('srvPrice').value };
    if(!data.name || !data.price) { alert("Vui lòng điền đủ tên và giá!"); return; }
    
    fetch(id ? "/admin_edit_procedure" : "/admin_add_procedure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    .then(r => r.json()).then(res => { if(res.status === 'success') { window.location.reload(); } else alert("Lỗi: " + res.message); });
}
function deleteService(id) {
    if(!confirm("Hành động này sẽ Xóa Dịch vụ. Bạn có chắc chắn?")) return;
    fetch("/admin_delete_procedure/" + id, { method: "DELETE" })
    .then(r => r.json()).then(res => { if(res.status === 'success') { window.location.reload(); } else alert("Lỗi: " + res.message); });
}

// ---- THÊM KHÁCH HÀNG MỚI ----
function submitAddClient() {
    const data = {
        name: document.getElementById('addClientName').value, 
        gender: document.getElementById('addClientGender').value,
        dob: document.getElementById('addClientDob').value, 
        phone: document.getElementById('addClientPhone').value,
        email: document.getElementById('addClientEmail').value, 
        address: document.getElementById('addClientAddress').value,
        pin: document.getElementById('addClientPin').value, 
        username: document.getElementById('addClientUser').value,
        password: document.getElementById('addClientPass').value
    };
    
    if(!data.name || !data.dob || !data.phone || !data.username || !data.password) { 
        alert("Vui lòng điền đủ các trường bắt buộc có dấu *"); return; 
    }
    
    fetch("/admin_add_client", {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
        if(res.status === 'success') { 
            alert("Thêm khách hàng thành công!"); 
            window.location.reload(); 
        } else alert("Lỗi: " + res.message);
    });
}

function submitAddEmployee() {
    const data = {
        name: document.getElementById('addEmpName').value, 
        gender: document.getElementById('addEmpGender').value,
        dob: document.getElementById('addEmpDob').value, 
        phone: document.getElementById('addEmpPhone').value,
        email: document.getElementById('addEmpEmail').value, 
        address: document.getElementById('addEmpAddress').value,
        pin: document.getElementById('addEmpPin').value, 
        type: document.getElementById('addEmpType').value,
        salary: document.getElementById('addEmpSalary').value, 
        username: document.getElementById('addEmpUser').value,
        password: document.getElementById('addEmpPass').value
    };
    
    if(!data.name || !data.dob || !data.phone || !data.username || !data.password || !data.salary) { 
        alert("Vui lòng điền đủ các trường bắt buộc có dấu *"); return; 
    }
    
    fetch("/admin_add_employee", {
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(data)
    }).then(r => r.json()).then(res => {
        if(res.status === 'success') { 
            alert("Thêm nhân viên thành công!"); 
            window.location.reload(); 
        } else alert("Lỗi: " + res.message);
    });
}