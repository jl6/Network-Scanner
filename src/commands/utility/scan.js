const { scanNetwork } = require('../../services/networkScanner');

module.exports = {
  name: 'scan',
  description: 'Scans the local network and lists active connected devices.',
  
  async execute(message, args) {
    const statusMsg = await message.channel.send('Scanning local network, please wait...');

    try {
      const devices = await scanNetwork();

      if (!devices || devices.length === 0) {
        return statusMsg.edit('Scan complete. No active devices found on the subnet.');
      }

      let responseText = `**Network Scan Results (${devices.length} Devices Found)**\n\`\`\``;
      responseText += 'IP Address'.padEnd(16) + 'MAC Address'.padEnd(20) + 'Hostname / Vendor\n';
      responseText += '-'.repeat(55) + '\n';

      devices.forEach(dev => {
        const ip = dev.ip.padEnd(16);
        const mac = dev.mac.padEnd(20);
        const name = dev.name.length > 18 ? dev.name.substring(0, 15) + '...' : dev.name;
        responseText += `${ip}${mac}${name}\n`;
      });

      responseText += '```';

      if (responseText.length > 2000) {
        return statusMsg.edit('Scan complete, but the list exceeds Discord message limits. Consider outputting to a file.');
      }

      await statusMsg.edit(responseText);

    } catch (error) {
      await statusMsg.edit(`An error occurred while executing the network scan: ${error.message}`);
    }
  }
};