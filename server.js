const net = require('net');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config(); 

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB Atlas"))
.catch(err => console.error("MongoDB connection error:", err));

// Schema & model
const sensorSchema = new mongoose.Schema({
  location: String,
  timestamp: Date,
  temperature: Number,
  wind_speed: Number,
  rainfall: Number
});
const SensorReading = mongoose.model('SensorReading', sensorSchema);

const app = express();
app.use(bodyParser.json());

// TCP server to receive sensor data
const tcpServer = net.createServer(socket => {
  socket.on('data', async (data) => {
    try {
      const reading = JSON.parse(data.toString());
      console.log("Received:", reading);
      const newReading = new SensorReading(reading);
      await newReading.save();
    } catch (err) {
      console.error("Invalid data:", data.toString());
    }
  });
});
tcpServer.listen(5000, () => console.log("TCP Server running on port 5000"));

// REST API to fetch readings
app.get('/api/readings', async (req, res) => {
  try {
    const readings = await SensorReading.find().sort({ timestamp: -1 }).limit(100);
    res.json(readings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch readings" });
  }
});

// REST API to receive alerts
app.post('/api/alerts', (req, res) => {
  console.log("Alert received:", req.body);
  res.status(201).json({ message: "Alert received", alert: req.body });
});

app.listen(3000, () => console.log("REST API running on port 3000"));
