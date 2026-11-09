const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// 1. Route trả về Giao diện Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/admin.html'));
});

// 2. Kết nối 4 Route API đại diện cho 4 phân hệ của nhóm
app.use('/api/account-admin', require('./routes/1_hongnhung_account_admin'));
app.use('/api/workshop-location', require('./routes/2_namanh_workshop_location'));
app.use('/api/customer-booking', require('./routes/3_thuphuong_customer_booking'));
app.use('/api/payment-support', require('./routes/4_myphuong_payment_support'));

// Khởi chạy Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});