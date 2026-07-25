const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

const SWIFT_SCAN_SCRIPT = `
import CoreWLAN

if let interface = CWWiFiClient.shared().interface() {
    do {
        let networks = try interface.scanForNetworks(withSSID: nil)
        for net in networks {
            let ssid = net.ssid ?? "Hidden Network"
            let bssid = net.bssid ?? "UNKNOWN"
            let rssi = net.rssiValue
            let channel = net.wlanChannel?.channelNumber ?? 0
            let isOpen = net.supportsSecurity(.none) ? "true" : "false"
            print("\\(ssid)|\\(bssid)|\\(rssi)|\\(channel)|\\(isOpen)")
        }
    } catch {
        print("ERROR:\\(error.localizedDescription)")
    }
}
`;

async function scanWifiSignals() {
  try {
    const command = `swift -e '${SWIFT_SCAN_SCRIPT.replace(/'/g, "'\\''")}'`;
    const { stdout, stderr } = await execAsync(command);

    if (stderr && stderr.includes('ERROR:')) {
      throw new Error(stderr.trim());
    }

    const lines = stdout.trim().split('\n').filter(Boolean);
    const networks = [];

    lines.forEach(line => {
      const [ssid, bssid, rssi, channel, isOpenStr] = line.split('|');
      if (ssid) {
        networks.push({
          ssid,
          bssid: bssid ? bssid.toUpperCase() : 'UNKNOWN',
          signal: `${rssi || 0} dBm`,
          security: isOpenStr === 'true' ? 'Open' : 'WPA2/WPA3',
          channel: channel || 'N/A',
          isOpen: isOpenStr === 'true'
        });
      }
    });

    const uniqueNetworks = Array.from(
      new Map(networks.map(item => [item.ssid + item.bssid, item])).values()
    );

    return {
      protected: uniqueNetworks.filter(n => !n.isOpen),
      open: uniqueNetworks.filter(n => n.isOpen)
    };

  } catch (error) {
    throw new Error(`macOS CoreWLAN scan failed: ${error.message}`);
  }
}

module.exports = {
  scanWifiSignals
};