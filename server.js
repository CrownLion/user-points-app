
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    description: String,
    vip: Boolean,
    points: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);

// User Registration
app.post('/register', async (req, res) => {
    const { username, password, description, vip } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, description, vip, points: 0 });
    await user.save();
    res.json({ message: 'User registered successfully' });
});

// User Login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user });
});

// Get All Users
app.get('/users', async (req, res) => {
    const users = await User.find({}, 'username description vip');
    res.json(users);
});

// Send Points
app.post('/sendPoints', async (req, res) => {
    const { sender, receiver, amount, giftWrap } = req.body;
    const senderUser = await User.findOne({ username: sender });
    const receiverUser = await User.findOne({ username: receiver });

    if (!senderUser || !receiverUser || senderUser.points < amount) {
        return res.status(400).json({ message: 'Transaction failed' });
    }

    senderUser.points -= amount;
    receiverUser.points += giftWrap ? 0 : amount;

    await senderUser.save();
    await receiverUser.save();

    res.json({ message: 'Points sent successfully' });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
