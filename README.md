# 🎵 Musicstagram

A social platform for musicians to share their tracks, connect with other artists, and build their musical community! 

## 🚀 Features

- 🎸 User profiles with instrument and genre preferences
- 🎵 Upload and share your music tracks
- 🌊 Beautiful waveform visualization for tracks
- ❤️ Like and interact with other musicians' posts
- 🎨 Dark mode UI that's easy on the eyes
- 🔥 Real-time audio preview when uploading

## 🛠️ Setup

1. Clone this repository:
```bash
git clone <your-repo-url>
cd musicstagram
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create the uploads directory:
```bash
mkdir -p static/uploads
```

5. Run the app:
```bash
python musicstagram.py
```

6. Visit `http://localhost:5000` in your browser and start sharing your music! 🎉

## 📝 Note

This is an MVP version. Future updates might include:
- 🎧 Playlists and reposts
- 💬 Comments on tracks
- 👥 Following other users
- 📊 Analytics for your tracks
- 📱 Mobile app

## 🔒 Security

Remember to update the `SECRET_KEY` in `musicstagram.py` before deploying to production!

## 🎨 Contributing

Feel free to submit PRs, open issues, or suggest new features! Let's make this the dopest platform for musicians together! 🤘 