const express = require('express');
const path = require('path');
const { scanNetwork } = require('./services/networkScanner');
const { scanBluetooth } = require('./services/bluetoothScanner');
const { scanWifiSignals } = require('./services/wifiScanner');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Scanner running at http://localhost:${PORT}`);
});