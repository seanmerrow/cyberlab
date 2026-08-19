const express = require('express');
const router = express.Router();
const pool = require('../db');
const requireAuth = require('../middleware/auth');

function toPlain(rows) {
  return Array.from(rows, row => ({ ...row }));
}

router.use(requireAuth);

router.get('/', async (req, res) => {
  const search = req.query.q || '';
  try {
    let rows;
    if (search) {
      const like = `%${search.replace(/\*/g, '%')}%`;
      rows = await pool.query(
        `SELECT patient_id, mrn, first_name, last_name, date_of_birth, gender, phone, email
         FROM patients
         WHERE first_name LIKE ? OR last_name LIKE ? OR mrn LIKE ?
         ORDER BY last_name, first_name
         LIMIT 200`,
        [like, like, like]
      );
    } else {
      rows = await pool.query(
        `SELECT patient_id, mrn, first_name, last_name, date_of_birth, gender, phone, email
         FROM patients
         ORDER BY last_name, first_name
         LIMIT 200`
      );
    }
    res.json(toPlain(rows));
  } catch (err) {
    console.error('Error fetching patients:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT * FROM patients WHERE patient_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json({ ...rows[0] });
  } catch (err) {
    console.error('Error fetching patient:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id/encounters', async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT e.*,
              v.systolic_bp, v.diastolic_bp, v.heart_rate, v.respiratory_rate,
              v.temperature_c, v.oxygen_saturation, v.weight_kg, v.height_cm, v.recorded_at
       FROM encounters e
       LEFT JOIN vitals v ON v.encounter_id = e.encounter_id
       WHERE e.patient_id = ?
       ORDER BY e.visit_start_datetime DESC`,
      [req.params.id]
    );
    res.json(toPlain(rows));
  } catch (err) {
    console.error('Error fetching encounters:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id/conditions', async (req, res) => {
  try {
    const rows = await pool.query(
      `SELECT * FROM medical_history
       WHERE patient_id = ?
       ORDER BY status = 'Active' DESC, diagnosed_date DESC`,
      [req.params.id]
    );
    res.json(toPlain(rows));
  } catch (err) {
    console.error('Error fetching conditions:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
