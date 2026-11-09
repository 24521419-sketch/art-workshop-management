const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối CSDL MySQL trên XAMPP
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'art_workshop'
});

// 1. API Tìm kiếm & Lọc Workshop
app.get('/api/workshops', async (req, res) => {
    try {
        const { search, category, location } = req.query;
        let sql = "SELECT * FROM workshops WHERE 1=1";
        const params = [];

        if (search) {
            sql += " AND (title LIKE ? OR description LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
            sql += " AND category = ?";
            params.push(category);
        }
        if (location) {
            sql += " AND location LIKE ?";
            params.push(`%${location}%`);
        }

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. API Xem Chi tiết Workshop + Lịch học + Khuyến nghị
app.get('/api/workshops/:id', async (req, res) => {
    try {
        const [ws] = await pool.query("SELECT * FROM workshops WHERE id = ?", [req.params.id]);
        if (ws.length === 0) return res.status(404).json({ message: "Không tìm thấy" });

        const [schedules] = await pool.query("SELECT * FROM schedules WHERE workshop_id = ?", [req.params.id]);
        const [recommendations] = await pool.query("SELECT * FROM workshops WHERE category = ? AND id != ? LIMIT 3", [ws[0].category, req.params.id]);

        res.json({ workshop: ws[0], schedules, recommendations });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. API Kiểm tra số chỗ còn trống
app.get('/api/schedules/:id/availability', async (req, res) => {
    try {
        const [sc] = await pool.query("SELECT max_capacity, booked_slots FROM schedules WHERE id = ?", [req.params.id]);
        if (sc.length === 0) return res.status(404).json({ message: "Lịch không tồn tại" });

        const available = sc[0].max_capacity - sc[0].booked_slots;
        res.json({ available_slots: Math.max(0, available) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. API Đặt vé (Booking)
app.post('/api/bookings', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { schedule_id, customer_name, customer_email, customer_phone, quantity } = req.body;

        const [sc] = await conn.query("SELECT s.*, w.price FROM schedules s JOIN workshops w ON s.workshop_id = w.id WHERE s.id = ? FOR UPDATE", [schedule_id]);
        if (sc.length === 0) throw new Error("Lịch học không tồn tại");

        const available = sc[0].max_capacity - sc[0].booked_slots;
        if (quantity > available) throw new Error(`Chỉ còn ${available} chỗ trống!`);

        const total_price = sc[0].price * quantity;

        await conn.query("INSERT INTO bookings (schedule_id, customer_name, customer_email, customer_phone, quantity, total_price) VALUES (?, ?, ?, ?, ?, ?)", 
        [schedule_id, customer_name, customer_email, customer_phone, quantity, total_price]);

        await conn.query("UPDATE schedules SET booked_slots = booked_slots + ? WHERE id = ?", [quantity, schedule_id]);

        await conn.commit();
        res.json({ success: true, message: "Đặt lịch thành công!", total_price });
    } catch (err) {
        await conn.rollback();
        res.status(400).json({ success: false, message: err.message });
    } finally {
        conn.release();
    }
});

app.listen(5000, () => console.log('Server running at http://localhost:5000'));