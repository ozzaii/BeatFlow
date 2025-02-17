# BeatFlow 🎵

A modern, collaborative beat-making platform with real-time collaboration, offline support, and a beautiful UI.

![BeatFlow Screenshot](static/img/screenshot1.png)

## Features ✨

- **Real-time Collaboration**
  - Live beat creation with multiple users
  - Cursor tracking and presence indicators
  - Chat system for communication
  - Version control for beats

- **Modern Beat Creation**
  - Intuitive pattern sequencer
  - High-quality audio samples
  - Effect chain with reverb, delay, and filters
  - Real-time audio processing

- **Progressive Web App**
  - Works offline
  - Background sync
  - Push notifications
  - Installable on any device

- **Beautiful UI**
  - Glass morphism design
  - Smooth animations
  - Responsive layout
  - Dark mode support

## Tech Stack 🛠️

- **Frontend**
  - HTML5 with modern CSS features
  - Vanilla JavaScript with modern APIs
  - Web Audio API for sound processing
  - Service Workers for offline support

- **Backend**
  - Flask for the web server
  - Supabase for real-time database
  - WebSocket for real-time communication
  - PostgreSQL for data storage

- **Infrastructure**
  - GitHub Pages for hosting
  - GitHub Actions for CI/CD
  - Supabase for backend services
  - CloudFlare for CDN

## Getting Started 🚀

### Prerequisites

- Python 3.9 or higher
- Node.js 16 or higher
- A Supabase account

### Installation

1. Clone the repository:
```bash
   git clone https://github.com/yourusername/beatflow.git
   cd beatflow
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
   npm install -g sass uglify-js clean-css-cli
```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. Initialize the database:
   ```bash
   flask db upgrade
   ```

6. Run the development server:
   ```bash
   flask run
   ```

Visit `http://localhost:5000` to see the app running.

## Deployment 🌐

### GitHub Pages

1. Fork this repository

2. Set up GitHub secrets:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_JWT_SECRET`
   - `GITHUB_PAGES_URL`

3. Enable GitHub Pages in repository settings

4. Push to main branch to trigger deployment

### Custom Domain

1. Add your domain in repository settings

2. Create CNAME record pointing to `yourusername.github.io`

3. Update `GITHUB_PAGES_URL` in GitHub secrets

## Development 👩‍💻

### File Structure

```
beatflow/
├── static/
│   ├── css/
│   ├── js/
│   ├── img/
│   └── fonts/
├── templates/
├── migrations/
├── scripts/
├── tests/
└── config/
```

### Running Tests

```bash
python -m pytest tests/
```

### Building Assets

```bash
python scripts/build.py
```

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct.

## License 📝

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Supabase](https://supabase.io/)
- [Flask](https://flask.palletsprojects.com/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## Support 💬

For support, email support@beatflow.app or join our Discord server.

## Roadmap 🗺️

- [ ] Mobile app using React Native
- [ ] AI-powered beat suggestions
- [ ] Advanced audio effects
- [ ] Social features
- [ ] Marketplace for beats

---

Made with ❤️ by the BeatFlow team 