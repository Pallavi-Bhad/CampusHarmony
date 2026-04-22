const API_URL = 'http://localhost:5000/api';
// --- AUTH HELPERS ---
function saveUserData(data) {
    localStorage.setItem('cms_role', data.role);
    if (data.user) {
        localStorage.setItem('cms_user', JSON.stringify(data.user));
    }
}

function getUserId() {
    const user = JSON.parse(localStorage.getItem('cms_user'));
    return user ? user.id : null;
}

function getRole() {
    return localStorage.getItem('cms_role');
}

function checkAuth(requiredRole) {
    const role = getRole();
    if (!role || (requiredRole && role !== requiredRole)) {
        window.location.href = 'index.html';
    }
    if (role === 'student' && document.getElementById('user-display-name')) {
        const user = JSON.parse(localStorage.getItem('cms_user'));
        document.getElementById('user-display-name').innerText = `Hello, ${user.name}`;
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// --- FORM HANDLERS ---

// Student Registration
const registerForm = document.getElementById('student-register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            full_name: document.getElementById('reg-name').value,
            department: document.getElementById('reg-dept').value,
            year: document.getElementById('reg-year').value,
            is_hosteller: document.getElementById('reg-hostel').value === '1',
            contact: document.getElementById('reg-contact').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-pass').value
        };

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (res.ok) {
                alert('Registration successful! Please login.');
                toggleSubForm('login');
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert('Server error');
        }
    });
}

// Student Login
const studentLoginForm = document.getElementById('student-login-form');
if (studentLoginForm) {
    studentLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('s-login-email').value;
        const password = document.getElementById('s-login-password').value;

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await res.json();
            if (res.ok) {
                saveUserData(result);
                window.location.href = 'student.html';
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert('Server error');
        }
    });
}

// Admin Registration
const adminRegisterForm = document.getElementById('admin-register-form');
if (adminRegisterForm) {
    adminRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('a-reg-email').value;
        const password = document.getElementById('a-reg-pass').value;

        try {
            const res = await fetch(`${API_URL}/auth/admin/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                alert('Admin registered successfully! Please login.');
                toggleAdminSubForm('login');
            } else {
                const result = await res.json();
                alert(result.message);
            }
        } catch (err) {
            alert('Server error');
        }
    });
}

// Admin Login
const adminLoginForm = document.getElementById('admin-login-form');
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('a-login-email').value;
        const password = document.getElementById('a-login-password').value;

        try {
            const res = await fetch(`${API_URL}/auth/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await res.json();
            if (res.ok) {
                saveUserData(result);
                window.location.href = 'admin.html';
            } else {
                alert(result.message);
            }
        } catch (err) {
            alert('Server error');
        }
    });
}

// --- STUDENT DASHBOARD LOGIC ---

// Submit Complaint
const complaintForm = document.getElementById('complaint-form');
if (complaintForm) {
    complaintForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('comp-category').value;
        const description = document.getElementById('comp-desc').value;

        try {
            const res = await fetch(`${API_URL}/complaints`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    student_id: getUserId(),
                    category, 
                    description 
                })
            });
            if (res.ok) {
                alert('Complaint submitted successfully');
                complaintForm.reset();
                loadMyComplaints();
            } else {
                alert('Submission failed');
            }
        } catch (err) {
            alert('Server error');
        }
    });
}

async function loadMyComplaints() {
    const listDiv = document.getElementById('my-complaints-list');
    if (!listDiv) return;

    try {
        const studentId = getUserId();
        const res = await fetch(`${API_URL}/complaints/my/${studentId}`);
        const complaints = await res.json();
        
        listDiv.innerHTML = complaints.map(c => `
            <div class="complaint-item stagger-item">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="font-weight:600; color:var(--primary)">#${c.id} - ${c.category}</span>
                    <span class="status-badge status-${c.status.toLowerCase().replace(' ', '')}">${c.status}</span>
                </div>
                <p style="font-size:0.95rem; margin-bottom:10px;">${c.description}</p>
                <div style="font-size:0.85rem; color:var(--text-dim);">
                    Created: ${new Date(c.created_at).toLocaleString()}<br>
                    ${c.admin_remark ? `<div style="margin-top:10px; padding:10px; background:rgba(255,255,255,0.05); border-radius:10px;"><strong>Admin Remark:</strong> ${c.admin_remark}</div>` : '<i>Wait for admin response</i>'}
                </div>
            </div>
        `).join('') || '<p>No complaints submitted yet.</p>';
    } catch (err) {
        listDiv.innerHTML = '<p>Error loading complaints.</p>';
    }
}

// --- ADMIN DASHBOARD LOGIC ---

async function loadAllComplaints() {
    const listDiv = document.getElementById('all-complaints-list');
    if (!listDiv) return;

    const category = document.getElementById('filter-category').value;
    const status = document.getElementById('filter-status').value;
    const department = document.getElementById('filter-dept').value;

    const query = new URLSearchParams({ category, status, department }).toString();

    try {
        const res = await fetch(`${API_URL}/admin/complaints?${query}`);
        const complaints = await res.json();

        listDiv.innerHTML = complaints.map(c => `
            <div class="glass-card stagger-item" style="padding:25px; margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div>
                        <h4 style="color:var(--primary)">${c.category} Complaint #${c.id}</h4>
                        <p style="color:var(--text-dim); font-size:0.9rem;">From: ${c.student_name} (${c.department}) | ${new Date(c.created_at).toLocaleString()}</p>
                    </div>
                    <span class="status-badge status-${c.status.toLowerCase().replace(' ', '')}">${c.status}</span>
                </div>
                <p style="margin:15px 0; font-size:1rem; line-height:1.5;">${c.description}</p>
                ${c.admin_remark ? `<div style="padding:10px; background:rgba(255,255,255,0.05); border-radius:10px; margin-bottom:15px;"><strong>Remark:</strong> ${c.admin_remark}</div>` : ''}
                <div class="admin-actions">
                    <button class="btn small-btn" onclick="openUpdateModal(${c.id}, '${c.status}', '${c.admin_remark || ''}')">Update Status</button>
                </div>
            </div>
        `).join('') || '<p style="text-align:center;">No complaints found for current filters.</p>';
    } catch (err) {
        listDiv.innerHTML = '<p>Error loading complaints.</p>';
    }
}

function openUpdateModal(id, status, remark) {
    document.getElementById('update-id').value = id;
    document.getElementById('update-status').value = status;
    document.getElementById('update-remark').value = remark;
    document.getElementById('update-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('update-modal').style.display = 'none';
}

const updateForm = document.getElementById('update-form');
if (updateForm) {
    updateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('update-id').value;
        const status = document.getElementById('update-status').value;
        const admin_remark = document.getElementById('update-remark').value;

        try {
            const res = await fetch(`${API_URL}/admin/complaints/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, admin_remark })
            });
            if (res.ok) {
                closeModal();
                loadAllComplaints();
            } else {
                alert('Update failed');
            }
        } catch (err) {
            alert('Server error');
        }
    });
}
