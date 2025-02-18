# BeatFlow - EDM Sound Sharing Platform 🎵

BeatFlow is a modern, social platform for creating and sharing EDM beats. With a futuristic cyberpunk interface and powerful beat-making capabilities, it's the perfect place for both beginners and experienced producers to create, share, and discover electronic music.

## ✨ Features

### Beat Creation
- 64-step beat sequencer with multiple tracks:
  - Kick drum
  - Snare/Clap
  - Hi-hats
  - Synth
- Real-time playback with Tone.js
- Adjustable BPM (60-180)
- Pattern randomization
- Save and load beats

### Social Features
- Share your beats with the community
- Like and comment on beats
- Follow other creators
- User profiles
- Genre-based discovery
- Real-time updates with Socket.IO

### Modern UI/UX
- Cyberpunk-inspired design
- Responsive interface
- Dark mode
- Interactive animations
- Beat visualization

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/beatflow.git
cd beatflow
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
pnpm install

# Install backend dependencies
cd ../backend
pnpm install
```

3. Set up environment variables:
```bash
# Backend (.env)
PORT=3000
MONGODB_URI=mongodb://localhost:27017/beatflow
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173

# Frontend (.env)
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

4. Start the development servers:
```bash
# Start backend
cd backend
pnpm dev

# Start frontend (in a new terminal)
cd frontend
pnpm dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 🛠️ Tech Stack

### Frontend
- React with Vite
- Chakra UI
- Tone.js for audio synthesis
- Socket.IO client
- Framer Motion for animations
- Axios for API calls

### Backend
- Express.js
- MongoDB with Mongoose
- Socket.IO
- JWT authentication
- Multer for file uploads

## 🎨 Design

The UI follows a cyberpunk aesthetic with:
- Neon accents
- Dark backgrounds
- Glowing elements
- Futuristic animations
- Responsive grid layouts

## 📱 Responsive Design

BeatFlow is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices

## 🔒 Security

- JWT-based authentication
- Secure password hashing
- Protected API endpoints
- File upload validation
- Rate limiting

## 🚀 Deployment

The application is configured for deployment on:
- Frontend: GitHub Pages
- Backend: Any Node.js hosting (Heroku, DigitalOcean, etc.)
- Database: MongoDB Atlas

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Tone.js](https://tonejs.github.io/) for audio synthesis
- [Chakra UI](https://chakra-ui.com/) for the component library
- [Socket.IO](https://socket.io/) for real-time features 