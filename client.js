const net = require('net');

const location = process.argv[2] || "Geelong";
const client = new net.Socket();

client.connect(5000, '127.0.0.1', () => {
  console.log(`Sensor at ${location} connected to server`);

  setInterval(() => {
    const reading = {
      location: location,
      timestamp: new Date().toISOString(),
      temperature: (20 + Math.random() * 15).toFixed(2), // 20–35 °C
      wind_speed: (5 + Math.random() * 20).toFixed(2),   // 5–25 km/h
      rainfall: (Math.random() * 10).toFixed(2)          // 0–10 mm
    };
    client.write(JSON.stringify(reading));
    console.log("Sent:", reading);
  }, 5000);
});
