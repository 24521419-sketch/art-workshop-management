const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Middleware dùng chung
app.use(cors());
app.use(express.json());

// ROUTE KHUNG CHO 4 PHÂN HỆ LỚN
// (Mỗi file route tương ứng với 1 phân hệ của 1 thành viên)
app.use('/api/auth', require('./routes/1_hongnhung_account_admin'));        // Phân hệ 1: Nhung
app.use('/api/workshops', require('./routes/2_namanh_workshop_location')); // Phân hệ 2: Nam Anh
app.use('/api/bookings', require('./routes/3_thuphuong_customer_booking'));   // Phân hệ 3: Thu Phương
app.use('/api/payments', require('./routes/4_myphuong_payment_support'));    // Phân hệ 4: Mỹ Phương

// Test Route Server
app.get('/', (req, res) => {
    res.send('Server Art Workshop Management đang chạy bình thường!');
});

// Khởi chạy Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});