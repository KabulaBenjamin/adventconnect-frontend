const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

const FIXED_SECRET = 'advent_connect_2026';

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

mongoose.connect('mongodb://127.0.0.1:27017/adventconnect')
  .then(() => console.log('✅ DB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
  username: String, email: { type: String, unique: true }, password: { type: String }, profilePic: { type: String, default: "" }
}));

const Post = mongoose.model('Post', new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  image: { type: String, default: "" },
  reactions: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, type: String }],
  prayers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, text: String, createdAt: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  createdAt: { type: Date, default: Date.now }
}));

// --- SOCKET LOGIC ---
let onlineUsers = new Map();
io.on('connection', (socket) => {
  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
  });
  socket.on('send_message', async (data) => {
    const msg = new Message(data);
    await msg.save();
    const targetSocket = onlineUsers.get(data.recipient);
    if (targetSocket) io.to(targetSocket).emit('receive_message', msg);
  });
  socket.on('disconnect', () => {
    for (let [userId, socketId] of onlineUsers) {
      if (socketId === socket.id) onlineUsers.delete(userId);
    }
  });
});

// --- ROUTES ---
app.post('/register', async (req, res) => {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const user = new User({ username: req.body.name, email: req.body.email, password: hashedPassword });
  await user.save();
  const token = jwt.sign({ id: user._id }, FIXED_SECRET);
  res.json({ token, user });
});

app.post('/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !await bcrypt.compare(req.body.password, user.password)) return res.status(401).send();
  const token = jwt.sign({ id: user._id }, FIXED_SECRET);
  res.json({ token, user });
});

app.get('/users', auth, async (req, res) => {
  const users = await User.find({}, 'username profilePic');
  res.json(users);
});

app.get('/posts', auth, async (req, res) => {
  const posts = await Post.find().populate('author comments.author', 'username profilePic').sort({ createdAt: -1 });
  res.json(posts);
});

app.post('/posts', auth, async (req, res) => {
  const post = new Post({ author: req.user.id, content: req.body.content });
  await post.save();
  res.json(await post.populate('author', 'username profilePic'));
});

app.get('/messages/:userId/:otherId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.params.userId, recipient: req.params.otherId },
        { sender: req.params.otherId, recipient: req.params.userId }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) { res.status(500).json(err); }
});

// Social Actions
app.post('/posts/:id/react', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  const idx = post.reactions.findIndex(r => r.user.toString() === req.user.id);
  if (idx > -1) post.reactions[idx].type = req.body.type;
  else post.reactions.push({ user: req.user.id, type: req.body.type });
  await post.save();
  res.json(post);
});

app.post('/posts/:id/pray', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  const idx = post.prayers.indexOf(req.user.id);
  idx === -1 ? post.prayers.push(req.user.id) : post.prayers.splice(idx, 1);
  await post.save();
  res.json(post);
});

server.listen(4000, () => console.log('🚀 AdventConnect Engine Online on 4000'));
