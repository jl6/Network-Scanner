const net = require('net');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

const COMMON_PORTS = [
  { port: 22, name: 'SSH' },
  { port: 80, name: 'HTTP' },
  { port: 443, name: 'HTTPS' },
  { port: 445, name: 'SMB' },
  { port: 3000, name: 'Node/Dev' },
  { port: 8080, name: 'HTTP-Alt' },
  { port: 8443, name: 'HTTPS-Alt' }
];

function checkPort(ip, port, timeoutMs = 400) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = 'closed';

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      status = 'open';
      socket.destroy();
    });

    socket.on('timeout', () => {
      socket.destroy();
    });

    socket.on('error', () => {
      socket.destroy();
    });

    socket.on('close', () => {
      resolve({ port, status });
    });

    socket.connect(port, ip);
  });
}

async function scanPorts(ip) {
  try {
    const checks = COMMON_PORTS.map(({ port, name }) => 
      checkPort(ip, port).then(res => ({ ...res, name }))
    );

    const results = await Promise.all(checks);
    const openPorts = results.filter(r => r.status === 'open');

    if (openPorts.length === 0) {
      return { 
        success: true, 
        output: `No common open ports detected on ${ip} (Scanned: 22, 80, 443, 445, 3000, 8080, 8443)` 
      };
    }

    const formatted = openPorts
      .map(p => `  • Port ${p.port} (${p.name}): OPEN`)
      .join('\n');

    return { 
      success: true, 
      output: `Open ports found on ${ip}:\n\n${formatted}` 
    };
  } catch (err) {
    return { success: false, output: `Port scan error: ${err.message}` };
  }
}

async function pingDevice(ip) {
  try {
    const { stdout } = await execAsync(`ping -c 3 -t 2 ${ip}`);
    return { success: true, output: stdout };
  } catch (err) {
    return { success: false, output: err.stdout || `Host ${ip} unreachable (Request timed out).` };
  }
}

module.exports = {
  pingDevice,
  scanPorts
};