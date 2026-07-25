const express = require('express');
const path = require('path');
const { scanNetwork } = require('./services/networkScanner');
const { scanBluetooth } = require('./services/bluetoothScanner');
const { scanWifiSignals } = require('./services/wifiScanner');
const { pingDevice, scanPorts } = require('./services/deviceActions');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // <-- Crucial for parsing POST request bodies
app.use(express.static(path.join(__dirname, 'public')));

// --- SCANNING ENDPOINTS ---

app.get('/api/scan', async (req, res) => {
  try {
    const devices = await scanNetwork();
    res.json({ success: true, devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/scan-bt', async (req, res) => {
  try {
    const devices = await scanBluetooth(5000);
    res.json({ success: true, count: devices.length, devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/scan-wifi-signals', async (req, res) => {
  try {
    const networks = await scanWifiSignals();
    res.json({ success: true, networks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- DEVICE ACTION ENDPOINTS ---

app.post('/api/action/ping', async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ success: false, error: 'IP address required' });
  
  const result = await pingDevice(ip);
  res.json(result);
});

app.post('/api/action/ports', async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ success: false, error: 'IP address required' });
  
  const result = await scanPorts(ip);
  res.json(result);
});

// --- SERVER INITIALIZATION ---

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Scanner running at http://localhost:${PORT}`);
});