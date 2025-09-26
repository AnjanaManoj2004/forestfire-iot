require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const net = require("net");

const app = express();
const PORT = process.env.PORT || 3000;       // REST API
const TCP_PORT = process.env.TCP_PORT || 5000; // TCP server for sensors

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/iotdb", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB connection error:", err));

// Schemas
const readingSchema = new mongoose.Schema({
    location: String,
    timestamp: { type: Date, default: Date.now },
    temperature: Number,
    wind_speed: Number,
    rainfall: Number,
});

const alertSchema = new mongoose.Schema({
    location: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
});

const Reading = mongoose.model("Reading", readingSchema);
const Alert = mongoose.model("Alert", alertSchema);

// TCP Server (sensor input)
const tcpServer = net.createServer(socket => {
    console.log("Sensor connected");

    socket.on("data", async data => {
        try {
            const reading = JSON.parse(data.toString());
            const newReading = new Reading(reading);
            await newReading.save();
            console.log("Saved reading:", reading);
        } catch (err) {
            console.error("Error saving reading:", err.message);
        }
    });

    socket.on("end", () => console.log("Sensor disconnected"));
});

tcpServer.listen(TCP_PORT, "0.0.0.0", () => {
    console.log(`TCP Server running on port ${TCP_PORT}`);
});

// REST API routes
app.get("/api/readings", async (req, res) => {
    try {
        const readings = await Reading.find().sort({ timestamp: -1 }).limit(50);
        res.json(readings);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch readings" });
    }
});

app.post("/api/alerts", async (req, res) => {
    try {
        const alert = new Alert(req.body);
        await alert.save();
        console.log("Alert received:", req.body);
        res.json({ message: "Alert saved", alert });
    } catch (err) {
        res.status(500).json({ error: "Failed to save alert" });
    }
});

// Start REST API
app.listen(PORT, "0.0.0.0", () => {
    console.log(`REST API running on port ${PORT}`);
});
