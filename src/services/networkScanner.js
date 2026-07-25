const findDevices = require('local-devices');
const { getVendor } = require('mac-oui-lookup');

const WIFI_VENDOR_KEYWORDS = [
  'apple', 'samsung', 'intel', 'qualcomm', 'broadcom', 'realtek', 
  'espressif', 'tp-link', 'tuya', 'xiaomi', 'huawei', 'sony', 
  'nintendo', 'amazon', 'roku', 'google', 'lg electronics', 'murata',
  'technicolor', 'arris', 'cisco-linksys', 'hon hai', 'foxconn'
];

function isWifiDevice(mac, name, vendor) {
  const normName = (name || '').toLowerCase();
  const normVendor = (vendor || '').toLowerCase();

  const wifiIdentifiers = [
    'iphone', 'ipad', 'android', 'galaxy', 'wireless', 'wifi', 
    'mobile', 'pixel', 'phone', 'watch', 'airpods'
  ];

  if (wifiIdentifiers.some(keyword => normName.includes(keyword))) {
    return true;
  }

  if (normVendor && normVendor !== 'unknown vendor') {
    return WIFI_VENDOR_KEYWORDS.some(keyword => normVendor.includes(keyword));
  }

  return false;
}

async function scanNetwork() {
  try {
    const rawDevices = await findDevices();
    
    const processed = rawDevices.map((device) => {
      const mac = device.mac ? device.mac.toUpperCase() : 'UNKNOWN';
      const rawName = device.name && device.name !== '?' ? device.name : 'Unknown Device';
      
      let vendor = 'Unknown Vendor';
      if (mac !== 'UNKNOWN') {
        vendor = getVendor(mac) || 'Unknown Vendor';
      }

      const isWifi = isWifiDevice(mac, rawName, vendor);

      return {
        ip: device.ip,
        mac,
        name: rawName !== 'Unknown Device' ? rawName : vendor,
        vendor,
        type: isWifi ? 'Wi-Fi' : 'Ethernet'
      };
    });

    return {
      ethernet: processed.filter(d => d.type === 'Ethernet'),
      wifi: processed.filter(d => d.type === 'Wi-Fi')
    };

  } catch (error) {
    throw new Error(`Network scan failed: ${error.message}`);
  }
}

module.exports = {
  scanNetwork
};