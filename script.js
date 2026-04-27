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
        batches: [],
        resources: [],
        newsList: [],
        recentScores: [],
        staffList: [],
        batchForm: { name: '', classLevel: '10', price: 0, originalPrice: 0, teacher: 'Sir (MathAntics)', schedule: '', startDate: '', duration: '', subjects: '', totalSeats: 100 },
        newsForm: { title: '', content: '' },
        docForm: { name: '', url: '', classGrade: 'All' },
        staffForm: { name: '', email: '', role: 'Teacher' },
        admissionSearch: '',
        newsSearch: '',
        resourceSearch: '',
        scoreSearch: '',
        staffSearch: '',
        classFilter: 'All',
        testScoreForm: { studentEmail: '', testName: '', classGrade: 'All', score: '', total: 100, percentage: 0, date: '' },
        staffEmails: ['admin@mathantics.com', 'teacher@mathantics.com', 'jay83856@gmail.com', 'crackamubyabhay@gmail.com'],
        userEmail: '',
        scholarshipTests: [],
        scholForm: { title: '', durationMinutes: 60, marksCorrect: 4, marksWrong: 1, questions: [] },
        assignForm: { testId: '', studentEmail: '' },
        assignResult: null,
        broadcastForm: { testId: '' },
        broadcastResult: null,
        testResults: [],
        showResultsModal: false,

        async init() {
            this.loading = true;
            
            // Verify session and get user info from the server
            const authRes = await fetch('/api/check-auth');
            const authData = await authRes.json();

            if (!authData.authenticated || authData.role !== 'staff') {
                window.location.href = 'index.html';
                return;
            }

            this.userEmail = authData.email.toLowerCase();
            const dbStaff = await (await fetch('/api/get-staff')).json();
            const dbEmails = dbStaff.map(s => s.email.toLowerCase());

            if (!this.userEmail || (!this.staffEmails.includes(this.userEmail) && !dbEmails.includes(this.userEmail))) {
                localStorage.clear();
                window.location.href = 'index.html';
                return;
            }

            this.staffList = dbStaff;
            this.isLoggedIn = true;
            this.loadData();
        },

        get filteredAdmissions() {
            return this.admissions.filter(a => {
                const query = this.admissionSearch.toLowerCase();
                const matchesSearch = !query || (a.name || '').toLowerCase().includes(query) || (a.email || '').toLowerCase().includes(query);
                const matchesClass = this.classFilter === 'All' || a.studentClass === this.classFilter;
                return matchesSearch && matchesClass;
            });
        },

        get filteredNews() {
            return this.newsList.filter(n => {
                const query = this.newsSearch.toLowerCase();
                return !query || n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query);
            });
        },

        get filteredResources() {
            return this.resources.filter(r => {
                const query = this.resourceSearch.toLowerCase();
                // Backend resources often use 'name' or 'title'
                const title = r.title || r.name || '';
                const matchesSearch = !query || title.toLowerCase().includes(query);
                const matchesClass = this.classFilter === 'All' || r.classGrade === this.classFilter || r.classGrade === 'All';
                return matchesSearch && matchesClass;
            });
        },

        get filteredScores() {
            return this.recentScores.filter(s => {
                const query = this.scoreSearch.toLowerCase();
                const matchesSearch = !query || 
                       s.studentEmail.toLowerCase().includes(query) || 
                       s.testName.toLowerCase().includes(query);
                const matchesClass = this.classFilter === 'All' || s.classGrade === this.classFilter;
                return matchesSearch && matchesClass;
            });
        },

        get filteredStaff() {
            return this.staffList.filter(s => {
                const query = this.staffSearch.toLowerCase();
                return !query || s.name.toLowerCase().includes(query) || s.email.toLowerCase().includes(query);
            });
        },

        getStaffEmail() {
            return this.userEmail;
        },

        async logout() {
            await fetch('/api/logout', { method: 'POST' });
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
                'docs': 'Resource Library Management',
                'scores': 'Manage Offline Test Scores',
                'manage-staff': 'Manage Team & Access',
                'batches': 'Manage Course Batches',
                'scholarship': 'Scholarship Test Management'
            };
            return titles[this.activeTab];
        },

        async loadData() {
            this.loading = true;
            try {
                const [admissionRes, resourceRes, newsRes, scoresRes, staffRes, batchRes] = await Promise.all([
                    fetch('/api/admissions'),
                    fetch('/api/resources'),
                    fetch('/api/get-news'),
                    fetch('/api/get-test-scores'),
                    fetch('/api/get-staff'),
                    fetch('/api/get-batches')
                ]);

                if (!admissionRes.ok) {
                    throw new Error('Failed to load admissions: ' + admissionRes.statusText);
                }
                if (!resourceRes.ok) {
                    throw new Error('Failed to load resources: ' + resourceRes.statusText);
                }
                if (!newsRes.ok) {
                    throw new Error('Failed to load news: ' + newsRes.statusText);
                }
                if (!scoresRes.ok) {
                    throw new Error('Failed to load test scores: ' + scoresRes.statusText);
                }
                if (!staffRes.ok) {
                    throw new Error('Failed to load staff list.');
                }
                if (!batchRes.ok) {
                    throw new Error('Failed to load batches.');
                }

                this.admissions = await admissionRes.json();
                this.resources = await resourceRes.json();
                this.newsList = await newsRes.json();
                this.recentScores = await scoresRes.json();
                this.staffList = await staffRes.json();
                this.batches = await batchRes.json();
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

        async deleteStudent(id) {
            if (!confirm('Are you sure you want to delete this student? They will need to register as a new student next time.')) return;
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/delete-student', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, staffEmail })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || response.statusText);
                }
                alert('Student record deleted successfully.');
                this.loadData();
            } catch (err) {
                console.error('Delete student error:', err);
                alert('Failed to delete student: ' + err.message);
            } finally {
                this.loading = false;
            }
        },

        async toggleBlockStudent(id, email, isCurrentlyBlocked) {
            const action = isCurrentlyBlocked ? 'unblock' : 'block';
            if (!confirm(`Are you sure you want to ${action} this student?\n\nEmail: ${email}`)) return;
            
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/toggle-block-student', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        studentId: id, 
                        studentEmail: email,
                        staffEmail,
                        block: !isCurrentlyBlocked
                    })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || response.statusText);
                }
                alert(`Student ${action}ed successfully!`);
                this.loadData();
            } catch (err) {
                console.error('Block/Unblock error:', err);
                alert(`Failed to ${action} student: ` + err.message);
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
                        classGrade: this.docForm.classGrade,
                        staffEmail
                    })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || response.statusText);
                }
                this.docForm = { name: '', url: '', classGrade: 'All' };
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

        async deleteNews(id) {
            if (!confirm('Delete this news? This action cannot be undone.')) return;
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/delete-news', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, staffEmail })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || response.statusText);
                }
                alert('News deleted successfully.');
                this.loadData();
            } catch (err) {
                console.error('Delete news error:', err);
                alert('Failed to delete news: ' + err.message);
            } finally {
                this.loading = false;
            }
        },

        async submitTestScore() {
            if (!this.testScoreForm.studentEmail || !this.testScoreForm.testName || !this.testScoreForm.score || !this.testScoreForm.date) {
                alert('Please fill in all fields.');
                return;
            }
            
            if (this.testScoreForm.score > this.testScoreForm.total) {
                alert('Score cannot be greater than total marks.');
                return;
            }

            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const percentage = Math.round((this.testScoreForm.score / this.testScoreForm.total) * 100);
                const response = await fetch('/api/submit-test-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentEmail: this.testScoreForm.studentEmail.trim().toLowerCase(),
                        testName: this.testScoreForm.testName.trim(),
                        classGrade: this.testScoreForm.classGrade,
                        score: parseFloat(this.testScoreForm.score),
                        total: parseFloat(this.testScoreForm.total),
                        percentage: percentage,
                        date: this.testScoreForm.date,
                        staffEmail
                    })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || response.statusText);
                }
                alert('Test score submitted successfully!');
                this.testScoreForm = { studentEmail: '', testName: '', classGrade: 'All', score: '', total: 100, percentage: 0, date: '' };
                this.loadData();
            } catch (err) {
                console.error('Submit score error:', err);
                alert('Failed to submit test score: ' + err.message);
            } finally {
                this.loading = false;
            }
        },

        async deleteScore(id) {
            if (!confirm('Delete this test score?')) return;
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/delete-test-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, staffEmail })
                });
                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.error || response.statusText);
                }
                alert('Test score deleted.');
                this.loadData();
            } catch (err) {
                console.error('Delete score error:', err);
                alert('Failed to delete score: ' + err.message);
            } finally {
                this.loading = false;
            }
        },

        async addStaff() {
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/add-staff', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...this.staffForm,
                        staffEmail
                    })
                });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to add staff.');
                }
                this.staffForm = { name: '', email: '', role: 'Teacher' };
                alert('Staff added! They can now login with their Gmail.');
                this.loadData();
            } catch (err) {
                alert(err.message);
            } finally {
                this.loading = false;
            }
        },

        async deleteStaff(id) {
            if (!confirm('Remove this staff member? They will lose access immediately.')) return;
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/delete-staff', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, staffEmail })
                });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error);
                }
                this.loadData();
            } catch (err) {
                alert(err.message);
            } finally {
                this.loading = false;
            }
        },

        async addBatch() {
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/add-batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...this.batchForm,
                        staffEmail
                    })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to create batch');
                }

                this.batchForm = { name: '', classLevel: '10', price: 0, originalPrice: 0, teacher: 'Sir (MathAntics)', schedule: '', startDate: '', duration: '', subjects: '', totalSeats: 100 };
                alert('Batch created successfully!');
                this.loadData();
            } catch (err) {
                alert('Error creating batch: ' + err.message);
            } finally {
                this.loading = false;
            }
        },

        async deleteBatch(id) {
            if (!confirm('Are you sure you want to delete this batch? All enrollment links will be broken.')) return;
            this.loading = true;
            try {
                const staffEmail = this.getStaffEmail();
                const response = await fetch('/api/delete-batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, staffEmail })
                });

                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to delete batch');
                }

                alert('Batch deleted.');
                this.loadData();
            } catch (err) {
                alert('Error deleting batch: ' + err.message);
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


        // ── SCHOLARSHIP TEST FUNCTIONS ─────────────────────────────────────

        addQuestion() {
            this.scholForm.questions.push({ question: '', options: ['', '', '', ''], correctIndex: 0 });
        },

        removeQuestion(index) {
            this.scholForm.questions.splice(index, 1);
        },

        async createScholarshipTest() {
            if (!this.scholForm.title || this.scholForm.questions.length === 0) {
                alert('Please add a title and at least one question.');
                return;
            }
            for (let i = 0; i < this.scholForm.questions.length; i++) {
                const q = this.scholForm.questions[i];
                if (!q.question.trim()) { alert('Q' + (i+1) + ': Question text is empty.'); return; }
                for (let j = 0; j < 4; j++) {
                    if (!q.options[j].trim()) { alert('Q' + (i+1) + ': Option ' + ['A','B','C','D'][j] + ' is empty.'); return; }
                }
            }
            this.loading = true;
            try {
                const res = await fetch('/api/scholarship/create-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: this.scholForm.title,
                        durationMinutes: this.scholForm.durationMinutes,
                        marksCorrect: this.scholForm.marksCorrect,
                        marksWrong: this.scholForm.marksWrong,
                        questions: this.scholForm.questions
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed');
                alert('Test saved! Test ID: ' + data.testId);
                this.scholForm = { title: '', durationMinutes: 60, marksCorrect: 4, marksWrong: 1, questions: [] };
                this.loadScholarshipTests();
            } catch(e) {
                alert('Error: ' + e.message);
            } finally {
                this.loading = false;
            }
        },

        async loadScholarshipTests() {
            try {
                const res = await fetch('/api/scholarship/tests');
                const data = await res.json();
                if (data.success) this.scholarshipTests = data.tests;
            } catch(e) {
                console.error('Failed to load scholarship tests', e);
            }
        },

        async assignToken() {
            if (!this.assignForm.testId || !this.assignForm.studentEmail) return;
            this.loading = true;
            this.assignResult = null;
            try {
                const res = await fetch('/api/scholarship/assign-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        testId: this.assignForm.testId,
                        studentEmail: this.assignForm.studentEmail.trim().toLowerCase()
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed');
                this.assignResult = { success: true, message: 'Code sent to ' + this.assignForm.studentEmail + '! Token: ' + data.token };
                this.assignForm.studentEmail = '';
            } catch(e) {
                this.assignResult = { success: false, message: 'Error: ' + e.message };
            } finally {
                this.loading = false;
            }
        },

        async broadcastTest() {
            if (!this.broadcastForm.testId) {
                this.broadcastResult = { success: false, message: 'Please select a test first.' };
                return;
            }
            
            if (!confirm('This will send the test code to ALL approved students. Continue?')) {
                return;
            }
            
            this.loading = true;
            this.broadcastResult = null;
            try {
                const res = await fetch('/api/scholarship/broadcast-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        testId: this.broadcastForm.testId
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Failed to broadcast');
                this.broadcastResult = { 
                    success: true, 
                    message: `✅ Test broadcasted successfully!\n\n📧 Emails sent: ${data.emailsSent}/${data.totalStudents}\n${data.emailsFailed > 0 ? '⚠️ Failed: ' + data.emailsFailed : ''}`
                };
                this.broadcastForm.testId = '';
            } catch(e) {
                this.broadcastResult = { success: false, message: 'Error: ' + e.message };
            } finally {
                this.loading = false;
            }
        },

        async viewTestResults(testId) {
            this.loading = true;
            try {
                const res = await fetch('/api/scholarship/results/' + testId);
                const data = await res.json();
                if (data.success) {
                    this.testResults = data.results;
                    this.showResultsModal = true;
                }
            } catch(e) {
                alert('Could not load results.');
            } finally {
                this.loading = false;
            }
        },

        async deleteScholarshipTest(id) {
            if (!confirm('Delete this test? All tokens for this test will become invalid.')) return;
            this.loading = true;
            try {
                const res = await fetch('/api/scholarship/delete-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ testId: id })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                this.loadScholarshipTests();
            } catch(e) {
                alert('Failed to delete: ' + e.message);
            } finally {
                this.loading = false;
            }
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