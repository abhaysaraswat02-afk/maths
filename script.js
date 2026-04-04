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
            const payRef = db.collection('payments').doc(id);
            const payDoc = await payRef.get();
            
            if (payDoc.exists) {
                const payData = payDoc.data();
                await payRef.update({ verified: true });
                
                // Automatically update student's paid balance in admissions
                const studentSnap = await db.collection('admissions').where('email', '==', payData.email).get();
                if (!studentSnap.empty) {
                    const studentRef = studentSnap.docs[0].ref;
                    const currentPaid = studentSnap.docs[0].data().feePaid || 0;
                    await studentRef.update({ feePaid: currentPaid + Number(payData.amount) });
                }
            }
            this.loading = false;
        },

        async postNews() {
            this.loading = true;
            await db.collection('notifications').add({
                ...this.newsForm,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            this.newsForm = { title: '', content: '' };
            alert('News posted successfully!');
            this.loading = false;
        },

        async addDoc() {
            this.loading = true;
            await db.collection('resources').add({
                title: this.docForm.name,
                link: this.docForm.url,
                type: 'pdf',
                classGrade: 'All',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
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
            if (data.length === 0) return alert("No data available to export.");
            const csvContent = "data:text/csv;charset=utf-8," 
                + Object.keys(data[0]).join(",") + "\n"
                + data.map(row => Object.values(row).join(",")).join("\n");
            window.open(encodeURI(csvContent));
        }
    };
}