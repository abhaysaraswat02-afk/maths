/**
 * Era of MathAntics - Staff Portal Logic
 * Handles Firestore integration and UI interactions
 */

// Firebase Configuration (Placeholders)
const firebaseConfig = {
    apiKey: "AIzaSyDkrbfNKopAWj7ZA5fCrkjsOz_dsdMCmCs",
    authDomain: "era-of-mathantics-8b6d1.firebaseapp.com",
    projectId: "era-of-mathantics-8b6d1",
    storageBucket: "era-of-mathantics-8b6d1.firebasestorage.app",
    messagingSenderId: "521238168559",
    appId: "1:521238168559:web:83b3c06de5b28b1eac6c1a",
    measurementId: "G-QDT3QZQFFQ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

function staffPortal() {
    return {
        isLoggedIn: false,
        error: '',
        activeTab: 'admissions',
        loading: false,
        admissions: [],
        resources: [],
        newsForm: { title: '', content: '' },
        docForm: { name: '', url: '' },
        staffEmails: ['admin@mathantics.com', 'teacher@mathantics.com', 'crackamubyabhay@gmail.com'],

        init() {
            // Security check: ensure staff is logged in via OTP on the main site
            if (localStorage.getItem('isStaffLoggedIn') !== 'true') {
                window.location.href = 'index.html';
                return;
            }
            const email = localStorage.getItem('student_email');
            if (!email || !this.staffEmails.includes(email)) {
                window.location.href = 'index.html';
                return;
            }

            this.isLoggedIn = true;
            this.loadData();
        },

        getStaffEmail() {
            return localStorage.getItem('student_email');
        },

        logout() {
            // If Firebase auth is available and a user is signed in, sign them out.
            if (firebase && firebase.auth) {
                try {
                    const currentAuth = firebase.auth();
                    if (currentAuth.currentUser) {
                        currentAuth.signOut().catch(err => console.warn('Firebase sign-out error:', err));
                    }
                } catch (err) {
                    console.warn('Firebase auth sign-out not available:', err);
                }
            }
            localStorage.removeItem('isStaffLoggedIn');
            localStorage.removeItem('student_email');
            window.location.href = 'index.html';
        },

        tabTitle() {
            const titles = {
                'admissions': 'Manage Student Admissions',
                'news': 'Broadcast College News',
                'docs': 'Resource Library Management'
            };
            return titles[this.activeTab];
        },

        async loadData() {
            this.loading = true;
            try {
                const [admissionRes, resourceRes] = await Promise.all([
                    fetch('/api/admissions'),
                    fetch('/api/resources')
                ]);

                if (!admissionRes.ok) {
                    throw new Error('Failed to load admissions: ' + admissionRes.statusText);
                }
                if (!resourceRes.ok) {
                    throw new Error('Failed to load resources: ' + resourceRes.statusText);
                }

                this.admissions = await admissionRes.json();
                this.resources = await resourceRes.json();
            } catch (err) {
                console.error('Data load error:', err);
                this.error = err.message;
            } finally {
                this.loading = false;
            }
        },

        async approveAdmission(id) {
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/approve-admission', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, staffEmail })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || response.statusText);
                }
                alert('Admission approved successfully!');
                this.loadData();
            } catch (err) {
                console.error('Approval error:', err);
                alert('Failed to approve admission: ' + err.message);
            } finally {
                this.loading = false;
            }
        },

        async postNews() {
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/post-news', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: this.newsForm.title,
                        content: this.newsForm.content,
                        staffEmail
                    })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || response.statusText);
                }
                this.newsForm = { title: '', content: '' };
                alert('News posted successfully!');
            } catch (err) {
                console.error('Post news error:', err);
                alert('Failed to post news: ' + err.message);
            } finally {
                this.loading = false;
            }
        },

        async addDoc() {
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/add-resource', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: this.docForm.name,
                        link: this.docForm.url,
                        staffEmail
                    })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || response.statusText);
                }
                this.docForm = { name: '', url: '' };
                alert('Resource added successfully!');
                this.loadData();
            } catch (err) {
                console.error('Add resource error:', err);
                alert('Failed to add resource: ' + err.message);
            } finally {
                this.loading = false;
            }
        },

        async deleteDoc(id) {
            if (!confirm('Delete this resource?')) return;
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/delete-resource', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, staffEmail })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || response.statusText);
                }
                alert('Resource deleted.');
                this.loadData();
            } catch (err) {
                console.error('Delete error:', err);
                alert('Failed to delete: ' + err.message);
            } finally {
                this.loading = false;
            }
        },

        formatDate(timestamp) {
            if (!timestamp) return 'N/A';
            // Handle Firestore Timestamp objects or ISO strings
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            
            if (isNaN(date.getTime())) return 'N/A';

            return date.toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        },

        exportData() {
            const data = this.admissions;
            if (data.length === 0) return alert("No data available to export.");
            const csvContent = "data:text/csv;charset=utf-8," 
                + Object.keys(data[0]).join(",") + "\n"
                + data.map(row => Object.values(row).join(",")).join("\n");
            window.open(encodeURI(csvContent));
        }
    };
}