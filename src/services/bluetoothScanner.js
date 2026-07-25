const noble = require('@abandonware/noble');

function scanBluetooth(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const devices = [];

    if (noble.state !== 'poweredOn') {
      return reject(new Error(`Bluetooth adapter is not active (State: ${noble.state})`));
    }

    const onDiscover = (peripheral) => {
      const address = peripheral.address && peripheral.address !== 'unknown' 
        ? peripheral.address.toUpperCase() 
        : peripheral.id;

      const name = peripheral.advertisement.localName || 'Unknown Device';
      const connectable = peripheral.connectable ? 'Yes' : 'No';
      const rssi = peripheral.rssi;

      if (!devices.some(d => d.address === address)) {
        devices.push({
          address,
          name,
          rssi: `${rssi} dBm`,
          connectable,
          id: peripheral.id
        });
      }
    };

    noble.on('discover', onDiscover);

    noble.startScanning([], true, (err) => {
      if (err) {
        noble.removeListener('discover', onDiscover);
        return reject(err);
      }

      setTimeout(() => {
        noble.stopScanning();
        noble.removeListener('discover', onDiscover);
        resolve(devices);
      }, timeoutMs);
    });
  });
}

module.exports = {
  scanBluetooth
};