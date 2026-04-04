/**
 * Era of MathAntics - Staff Portal Logic
 * Handles Firestore integration and UI interactions
 */

// Firebase Configuration (Placeholders)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "maths-main.firebaseapp.com",
    projectId: "maths-main",
    storageBucket: "maths-main.appspot.com",
    messagingSenderId: "YOUR_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function staffPortal() {
    return {
        isLoggedIn: false,
        loginPass: '',
        error: '',
        activeTab: 'admissions',
        loading: false,
        admissions: [],
        payments: [],
        resources: [],
        newsForm: { title: '', content: '' },
        docForm: { name: '', url: '' },

        init() {
            // Check session storage for persistence
            if (sessionStorage.getItem('staffAuth') === 'true') {
                this.isLoggedIn = true;
                this.loadData();
            }
        },

        login() {
            if (this.loginPass === 'Admin@2026') {
                this.isLoggedIn = true;
                sessionStorage.setItem('staffAuth', 'true');
                this.error = '';
                this.loadData();
            } else {
                this.error = 'Invalid password access denied.';
            }
        },

        logout() {
            this.isLoggedIn = false;
            sessionStorage.removeItem('staffAuth');
        },

        tabTitle() {
            const titles = {
                'admissions': 'Manage Student Admissions',
                'payments': 'Fee Payment Verification',
                'news': 'Broadcast College News',
                'docs': 'Resource Library Management'
            };
            return titles[this.activeTab];
        },

        async loadData() {
            this.loading = true;
            try {
                // Real-time listeners for all sections
                db.collection('admissions').orderBy('createdAt', 'desc').onSnapshot(snap => {
                    this.admissions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                });

                db.collection('payments').orderBy('timestamp', 'desc').onSnapshot(snap => {
                    this.payments = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                });

                db.collection('resources').onSnapshot(snap => {
                    this.resources = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                });
            } catch (err) {
                console.error("Data load error:", err);
            } finally {
                this.loading = false;
            }
        },

        async approveAdmission(id) {
            this.loading = true;
            await db.collection('admissions').doc(id).update({ status: 'Approved' });
            this.loading = false;
        },

        async verifyPayment(id) {
            this.loading = true;
            await db.collection('payments').doc(id).update({ verified: true });
            this.loading = false;
        },

        async postNews() {
            this.loading = true;
            await db.collection('news').add({
                ...this.newsForm,
                date: new Date().toISOString()
            });
            this.newsForm = { title: '', content: '' };
            alert('News posted successfully!');
            this.loading = false;
        },

        async addDoc() {
            this.loading = true;
            await db.collection('resources').add(this.docForm);
            this.docForm = { name: '', url: '' };
            this.loading = false;
        },

        async deleteDoc(id) {
            if (confirm('Delete this resource?')) {
                await db.collection('resources').doc(id).delete();
            }
        },

        formatDate(isoString) {
            if (!isoString) return 'N/A';
            return new Date(isoString).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        },

        exportData() {
            const data = this.activeTab === 'admissions' ? this.admissions : this.payments;
            const csvContent = "data:text/csv;charset=utf-8," 
                + Object.keys(data[0]).join(",") + "\n"
                + data.map(row => Object.values(row).join(",")).join("\n");
            window.open(encodeURI(csvContent));
        }
    };
}