import express from 'express';
const router = express.Router();

router.get('/privacy-policy', (req, res) => {
    res.send(`
    <h1>Privacy Policy</h1>
    <p>Development version privacy policy.</p>
  `);
});

router.get('/terms-of-service', (req, res) => {
    res.send(`
    <h1>Terms of Service</h1>
    <p>Development version terms of service.</p>
  `);
});

export default router; 