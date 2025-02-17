from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
import os
import uuid
import logging
from logging.handlers import RotatingFileHandler
from functools import wraps
import time
from collections import defaultdict
import json
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_compress import Compress
from flask_caching import Cache
from flask_talisman import Talisman

# Initialize Flask app
app = Flask(__name__, 
    static_folder='static',
    static_url_path='/static',
    template_folder='templates'
)

# Configure app
app.config.update(
    SECRET_KEY=os.environ.get('SECRET_KEY', 'dev_key_123'),
    SQLALCHEMY_DATABASE_URI='sqlite:///musicstagram.db',
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    UPLOAD_FOLDER=os.path.join('static', 'uploads'),
    MAX_CONTENT_LENGTH=50 * 1024 * 1024,  # 50MB
    ALLOWED_EXTENSIONS={'mp3', 'wav', 'ogg', 'm4a', 'aac'},
    TEMPLATES_AUTO_RELOAD=True,
    DEBUG=True,
    PERMANENT_SESSION_LIFETIME=timedelta(days=1),
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SERVER_PORT=5001
)

# Initialize extensions
db = SQLAlchemy(app)

# Models that SLAP 🔥
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    bio = db.Column(db.String(500))
    instrument = db.Column(db.String(100))
    genre = db.Column(db.String(100))
    posts = db.relationship('Post', backref='author', lazy=True)
    comments = db.relationship('Comment', backref='author', lazy=True)
    followers = db.relationship(
        'User', secondary='followers',
        primaryjoin='User.id==followers.c.followed_id',
        secondaryjoin='User.id==followers.c.follower_id',
        backref=db.backref('following', lazy='dynamic'),
        lazy='dynamic'
    )

# Followers association table
followers = db.Table('followers',
    db.Column('follower_id', db.Integer, db.ForeignKey('user.id')),
    db.Column('followed_id', db.Integer, db.ForeignKey('user.id'))
)

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    music_file = db.Column(db.String(200), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    likes = db.relationship('Like', backref='post', lazy=True)
    comments = db.relationship('Comment', backref='post', lazy=True, cascade='all, delete-orphan')
    play_count = db.Column(db.Integer, default=0)
    beat_data = db.Column(db.Text)  # Store beat pattern data
    bpm = db.Column(db.Integer, default=128)  # Beats per minute
    style = db.Column(db.String(50))  # Beat style/genre
    effects_data = db.Column(db.Text)  # Store effects settings
    is_beat_pattern = db.Column(db.Boolean, default=False)  # Flag for beat vs regular upload

    def to_dict(self):
        """Convert post to dictionary with all beat info"""
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'timestamp': self.timestamp.isoformat(),
            'author': self.author.username,
            'play_count': self.play_count,
            'likes_count': len(self.likes),
            'comments_count': len(self.comments),
            'beat_data': json.loads(self.beat_data) if self.beat_data else None,
            'bpm': self.bpm,
            'style': self.style,
            'effects_data': json.loads(self.effects_data) if self.effects_data else None,
            'is_beat_pattern': self.is_beat_pattern
        }

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.String(500), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

class Like(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('post.id'), nullable=False)

# Initialize remaining extensions after models
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
compress = Compress(app)
cache = Cache(app, config={'CACHE_TYPE': 'simple'})
talisman = Talisman(
    app,
    content_security_policy={
        'default-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'cdn.honey.io', '*'],
        'img-src': ["'self'", 'data:', 'blob:', 'cdn.honey.io', '*'],
        'media-src': ["'self'", 'data:', 'blob:'],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'cdn.honey.io'],
        'style-src': ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'cdn.honey.io', '*']
    },
    force_https=False
)

# Enhanced rate limiting with IP tracking
RATE_LIMIT = 10  # Increased to 10 requests
RATE_LIMIT_PERIOD = 60  # seconds
request_counts = defaultdict(lambda: {'count': 0, 'reset_time': 0, 'blocked_until': 0})

def rate_limit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            app.logger.error(f'Rate limit exceeded: {e}')
            flash('Whoa there! Slow down a bit! 🐎', 'warning')
            return redirect(url_for('index'))
    return decorated_function

# Setup logging
if not os.path.exists('logs'):
    os.mkdir('logs')
file_handler = RotatingFileHandler('logs/musicstagram.log', maxBytes=10240, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)
app.logger.info('Musicstagram startup - Debug mode: %s', app.debug)

# Ensure upload directory exists
upload_dir = app.config['UPLOAD_FOLDER']
if not os.path.exists(upload_dir):
    os.makedirs(upload_dir, mode=0o755)
else:
    os.chmod(upload_dir, 0o755)

def init_db():
    """Initialize database and create tables if they don't exist."""
    try:
        with app.app_context():
            # Only create tables if they don't exist
            db.create_all()
            app.logger.info('Database tables ready to rock 🎯')
    except Exception as e:
        app.logger.error(f'Error initializing database: {str(e)} 😢')
        raise

# Initialize database
init_db()

# App Configuration
basedir = os.path.abspath(os.path.dirname(__file__))

def allowed_file(filename):
    """Check if file extension is allowed"""
    if '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[1].lower()
    return ext in app.config['ALLOWED_EXTENSIONS']

def generate_unique_filename(filename):
    """Generate a unique filename while preserving the original extension."""
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    return f"{uuid.uuid4().hex}.{ext}"

# Middleware to check if user is logged in
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('You need to log in first! 🎸', 'warning')
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

# Routes that go HARD 💪
@app.route('/')
def index():
    app.logger.info(f'Index route accessed. Session: {session}')
    
    if 'user_id' not in session:
        app.logger.info('No user_id in session, redirecting to welcome')
        return redirect(url_for('welcome'))
        
    try:
        current_user = User.query.filter_by(id=session['user_id']).first()
        if not current_user:
            session.clear()
            app.logger.warning(f'User session exists but user not found in DB 🤔')
            return redirect(url_for('login'))

        # Get all posts for feed
        posts = Post.query.order_by(Post.timestamp.desc()).all()
        app.logger.info(f'User {current_user.username} accessed feed 🎵')
        # Force render the index template for logged in users
        return render_template('index.html', posts=posts, current_user=current_user)
    except Exception as e:
        app.logger.error(f'Error loading feed: {str(e)} 😢')
        session.clear()
        flash('Having trouble loading the beats... Try again! 🎵', 'error')
        return redirect(url_for('login'))

@app.route('/welcome')
def welcome():
    # If user is logged in, they should see the feed
    if 'user_id' in session:
        app.logger.info(f'Welcome route: Redirecting logged in user {session["user_id"]} to feed')
        return redirect(url_for('index'))
    app.logger.info('Welcome route: Showing welcome page to anonymous user')
    return render_template('welcome.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if 'user_id' in session:
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        try:
            username = request.form.get('username', '').strip()
            email = request.form.get('email', '').strip()
            password = request.form.get('password', '').strip()
            
            # Validate required fields
            if not username or not email or not password:
                flash('All fields are required! 🎸', 'warning')
                return redirect(url_for('signup'))
            
            # Check username length
            if len(username) < 3:
                flash('Username must be at least 3 characters long! 🎵', 'warning')
                return redirect(url_for('signup'))
            
            # Check if username exists
            if User.query.filter_by(username=username).first():
                flash('Username already exists fam! Try another one 🤔', 'warning')
                return redirect(url_for('signup'))
                
            # Check if email exists
            if User.query.filter_by(email=email).first():
                flash('Email already registered! Maybe try logging in? 🎸', 'warning')
                return redirect(url_for('login'))
                
            # Create new user
            user = User(
                username=username,
                email=email,
                password_hash=generate_password_hash(password),
                instrument=request.form.get('instrument'),
                genre=request.form.get('genre'),
                bio=request.form.get('bio')
            )
            
            # Add and commit with error handling
            try:
                db.session.add(user)
                db.session.commit()
                app.logger.info(f'New user registered successfully: {username} 🎉')
                
                # Log them in automatically
                session.clear()
                session.permanent = True
                session['user_id'] = user.id
                session['username'] = user.username
                session['last_activity'] = time.time()
                
                flash('Welcome to Musicstagram! Time to drop some heat! 🎵', 'success')
                return redirect(url_for('index'))
                
            except Exception as e:
                db.session.rollback()
                app.logger.error(f'Database error during signup: {str(e)} 😢')
                flash('Something went wrong! Try again later 😢', 'error')
                return redirect(url_for('signup'))
                
        except Exception as e:
            app.logger.error(f'Error during signup: {str(e)} 😢')
            flash('Something went wrong! Try again later 😢', 'error')
            return redirect(url_for('signup'))
            
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    app.logger.info(f'Login route accessed. Method: {request.method}, Session: {session}')
    
    # Don't clear session on GET requests
    if request.method == 'GET' and 'user_id' in session:
        app.logger.info(f'Already logged in user {session["user_id"]} accessing login page')
        return redirect(url_for('index'))
        
    if request.method == 'POST':
        try:
            username = request.form.get('username', '').strip()
            password = request.form.get('password', '').strip()
            
            app.logger.info(f'Login attempt for username: {username}')
            
            # Validate input
            if not username or not password:
                flash('Please fill in all fields! 🤔', 'warning')
                return redirect(url_for('login'))
            
            # Get user and verify password
            user = User.query.filter_by(username=username).first()
            
            if user is None:
                app.logger.warning(f'Login failed - user not found: {username}')
                flash('Invalid username or password! 🚫', 'error')
                return redirect(url_for('login'))
            
            if not check_password_hash(user.password_hash, password):
                app.logger.warning(f'Login failed - invalid password for user: {username}')
                flash('Invalid username or password! 🚫', 'error')
                return redirect(url_for('login'))
            
            # Set up session
            session.clear()
            session.permanent = True
            session['user_id'] = user.id
            session['username'] = user.username
            session['last_activity'] = time.time()
            
            # Force session to be saved
            session.modified = True
            
            app.logger.info(f'User logged in successfully: {username} 🎵 (ID: {user.id})')
            app.logger.info(f'Session after login: {session}')
            
            flash(f'Welcome back, {username}! Ready to make some music? 🎵', 'success')
            
            # Redirect to next page or index
            next_page = request.args.get('next')
            if next_page and url_for('static', filename='') not in next_page:
                return redirect(next_page)
                
            # Force redirect to index for feed
            return redirect(url_for('index'))
                
        except Exception as e:
            app.logger.error(f'Login error: {str(e)} 😢')
            flash('Something went wrong! Please try again. 😅', 'error')
            return redirect(url_for('login'))
            
    return render_template('login.html')

@app.route('/check_login')
def check_login():
    """Check if user is still logged in and session is valid"""
    try:
        if 'user_id' not in session:
            return jsonify({'logged_in': False})
            
        # Check session expiry
        last_activity = session.get('last_activity', 0)
        if time.time() - last_activity > app.config['PERMANENT_SESSION_LIFETIME'].total_seconds():
            session.clear()
            return jsonify({'logged_in': False})
            
        # Update last activity
        session['last_activity'] = time.time()
        return jsonify({'logged_in': True})
        
    except Exception as e:
        app.logger.error(f"Login check error: {str(e)}")
        return jsonify({'logged_in': False})

@app.before_request
def check_session_expiry():
    """Check session expiry before each request"""
    app.logger.debug(f'Checking session before request: {session}')
    
    if 'user_id' in session:
        last_activity = session.get('last_activity', 0)
        if time.time() - last_activity > app.config['PERMANENT_SESSION_LIFETIME'].total_seconds():
            app.logger.warning('Session expired, clearing...')
            session.clear()
            flash('Session expired! Please log in again. 🔑', 'warning')
            return redirect(url_for('login'))
            
        # Update last activity
        session['last_activity'] = time.time()
        session.modified = True
        
        # Verify user still exists in DB
        try:
            user = User.query.get(session['user_id'])
            if not user:
                app.logger.warning(f'User {session["user_id"]} not found in DB, clearing session')
                session.clear()
                flash('Please log in again! 🎸', 'warning')
                return redirect(url_for('login'))
        except Exception as e:
            app.logger.error(f'Error checking user in DB: {str(e)}')
            session.clear()
            return redirect(url_for('login'))

@app.route('/post/new', methods=['GET', 'POST'])
@login_required
def new_post():
    if request.method == 'POST':
        try:
            # Check if the post request has the file part
            if 'music_file' not in request.files:
                app.logger.warning('No file part in request')
                flash('No file uploaded! Where\'s the heat? 🔥', 'warning')
                return redirect(request.url)
                
            file = request.files['music_file']
            
            # Check if a file was selected
            if file.filename == '':
                app.logger.warning('No file selected')
                flash('No file selected! Don\'t leave us hanging! 😤', 'warning')
                return redirect(request.url)
            
            # Check file size before processing
            if request.content_length > app.config['MAX_CONTENT_LENGTH']:
                app.logger.warning(f'File too large: {request.content_length} bytes')
                flash('File too large! Keep it under 50MB fam! 📦', 'warning')
                return redirect(request.url)
                
            # Validate file type
            if not allowed_file(file.filename):
                app.logger.warning(f'Invalid file type: {file.filename}')
                flash('Invalid file type! We only accept MP3, WAV, OGG, M4A, and AAC! 🎵', 'warning')
                return redirect(request.url)
            
            try:
                # Generate unique filename and save file
                filename = generate_unique_filename(secure_filename(file.filename))
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                # Verify file was saved successfully
                if not os.path.exists(file_path):
                    raise Exception('File failed to save')
                
                # Create post record
                post = Post(
                    title=request.form['title'],
                    description=request.form['description'],
                    music_file=filename,
                    user_id=session['user_id']
                )
                db.session.add(post)
                db.session.commit()
                
                app.logger.info(f'New track uploaded successfully: {filename} by user {session["user_id"]}')
                flash('Your track is live! Let\'s get this bread! 🍞', 'success')
                return redirect(url_for('profile', username=post.author.username))
                
            except Exception as e:
                # Clean up file if it was saved but database operation failed
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise e
                
        except Exception as e:
            db.session.rollback()
            app.logger.error(f'Error uploading track: {str(e)}')
            flash('Something went wrong! Try again later 😢', 'error')
            return redirect(request.url)
            
    return render_template('new_post.html')

@app.route('/like/<int:post_id>', methods=['POST'])
@login_required
@rate_limit
def like_post(post_id):
    try:
        existing_like = Like.query.filter_by(
            user_id=session['user_id'],
            post_id=post_id
        ).first()
        
        if existing_like:
            db.session.delete(existing_like)
            message = 'Unlike... tough crowd 😢'
            status = 'unliked'
        else:
            like = Like(user_id=session['user_id'], post_id=post_id)
            db.session.add(like)
            message = 'You\'re vibing with this! 🎵'
            status = 'liked'
            
        db.session.commit()
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({
                'status': status,
                'likes_count': Like.query.filter_by(post_id=post_id).count()
            })
        flash(message)
        return redirect(request.referrer or url_for('index'))
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error in like operation: {e}')
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'error': 'Failed to update like status'}), 500
        flash('Something went wrong! Try again later 😢', 'error')
        return redirect(request.referrer or url_for('index'))

@app.route('/post/<int:post_id>/comment', methods=['POST'])
@login_required
@rate_limit
def add_comment(post_id):
    try:
        content = request.form.get('content')
        if not content:
            return jsonify({'error': 'Comment cannot be empty'}), 400
            
        comment = Comment(
            content=content,
            user_id=session['user_id'],
            post_id=post_id
        )
        db.session.add(comment)
        db.session.commit()
        app.logger.info(f'New comment added on post {post_id} by user {session["user_id"]}')
        
        return jsonify({
            'id': comment.id,
            'content': comment.content,
            'author': comment.author.username,
            'author_url': url_for('profile', username=comment.author.username),
            'timestamp': comment.timestamp.strftime('%B %d, %Y %I:%M %p'),
            'author_instrument': comment.author.instrument
        })
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error adding comment: {e}')
        return jsonify({'error': 'Failed to add comment'}), 500

@app.route('/post/<int:post_id>/play', methods=['POST'])
@rate_limit
def track_play(post_id):
    try:
        post = Post.query.get_or_404(post_id)
        post.play_count += 1
        db.session.commit()
        app.logger.info(f'Track {post_id} played. New count: {post.play_count}')
        return jsonify({'play_count': post.play_count})
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error updating play count: {e}')
        return jsonify({'error': 'Failed to update play count'}), 500

@app.route('/user/<username>')
def profile(username):
    try:
        user = User.query.filter_by(username=username).first_or_404()
        posts = Post.query.filter_by(user_id=user.id).order_by(Post.timestamp.desc()).all()
        is_following = False
        if 'user_id' in session:
            current_user = User.query.get(session['user_id'])
            is_following = current_user.following.filter_by(id=user.id).first() is not None
        return render_template('profile.html', user=user, posts=posts, is_following=is_following)
    except Exception as e:
        app.logger.error(f'Error loading profile: {e}')
        flash('Profile not found or something went wrong! 😢', 'error')
        return redirect(url_for('index'))

@app.route('/follow/<username>', methods=['POST'])
@login_required
@rate_limit
def follow(username):
    try:
        user_to_follow = User.query.filter_by(username=username).first_or_404()
        current_user = User.query.get(session['user_id'])
        
        if user_to_follow.id == current_user.id:
            return jsonify({'error': 'Cannot follow yourself'}), 400
            
        if current_user.following.filter_by(id=user_to_follow.id).first():
            current_user.following.remove(user_to_follow)
            db.session.commit()
            return jsonify({
                'status': 'unfollowed',
                'followers_count': user_to_follow.followers.count()
            })
        else:
            current_user.following.append(user_to_follow)
            db.session.commit()
            return jsonify({
                'status': 'followed',
                'followers_count': user_to_follow.followers.count()
            })
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error in follow operation: {e}')
        return jsonify({'error': 'Failed to update follow status'}), 500

@app.route('/search')
def search():
    try:
        query = request.args.get('q', '')
        filter_by = request.args.get('filter', 'all')
        
        if filter_by == 'genre':
            users = User.query.filter(User.genre.ilike(f'%{query}%')).all()
        elif filter_by == 'instrument':
            users = User.query.filter(User.instrument.ilike(f'%{query}%')).all()
        else:
            users = User.query.filter(
                db.or_(
                    User.username.ilike(f'%{query}%'),
                    User.genre.ilike(f'%{query}%'),
                    User.instrument.ilike(f'%{query}%')
                )
            ).all()
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify([{
                'username': user.username,
                'profile_url': url_for('profile', username=user.username),
                'instrument': user.instrument,
                'genre': user.genre,
                'bio': user.bio[:100] + '...' if user.bio else None,
                'tracks_count': len(user.posts),
                'followers_count': user.followers.count(),
                'following_count': user.following.count()
            } for user in users])
            
        return render_template('search.html', users=users, query=query, filter_by=filter_by)
    except Exception as e:
        app.logger.error(f'Error in search: {e}')
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'error': 'Search failed'}), 500
        flash('Search failed! Try again later 😢', 'error')
        return redirect(url_for('index'))

@app.route('/logout', methods=['POST'])
def logout():
    if 'user_id' in session:
        app.logger.info(f'User {session["user_id"]} logged out')
        session.pop('user_id', None)
        flash('Catch you on the flip side! 🤘', 'success')
    return redirect(url_for('login'))

@app.route('/synth')
@app.route('/synth/<int:beat_id>')
@login_required
def synth(beat_id=None):
    try:
        if not session.get('user_id'):
            app.logger.warning('Session validation failed - redirecting to login 🔐')
            flash('Please log in to access the beat lab! 🎵', 'warning')
            return redirect(url_for('login'))

        current_user = User.query.filter_by(id=session['user_id']).first()
        if not current_user:
            app.logger.error(f'User not found for ID {session["user_id"]} 😱')
            session.clear()
            return redirect(url_for('login'))

        app.logger.info(f'User {current_user.username} accessing synth 🎹')

        # Available instruments
        instruments = ['kick', 'snare', 'hihat', 'clap', 'tom', 'cymbal']

        # Preset beats - absolute fire! 🔥
        presets = {
            'techno_basic': {
                'name': 'Basic Techno',
                'bpm': 128,
                'pattern': {
                    'kick': [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
                    'hihat': [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
                    'snare': [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
                    'clap': [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]
                }
            },
            'techno_groove': {
                'name': 'Groovy Techno',
                'bpm': 130,
                'pattern': {
                    'kick': [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
                    'hihat': [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
                    'snare': [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
                    'clap': [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1]
                }
            },
            'techno_dark': {
                'name': 'Dark Techno',
                'bpm': 135,
                'pattern': {
                    'kick': [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
                    'hihat': [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
                    'snare': [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
                    'tom': [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0]
                }
            },
            'techno_acid': {
                'name': 'Acid Techno',
                'bpm': 140,
                'pattern': {
                    'kick': [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,1,0,0],
                    'hihat': [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
                    'snare': [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1],
                    'cymbal': [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1]
                }
            }
        }

        if beat_id:
            try:
                beat = Post.query.get_or_404(beat_id)
                if not beat.is_beat_pattern:
                    flash('That\'s not a beat pattern fam! 🤔', 'warning')
                    return redirect(url_for('index'))

                if beat.user_id != current_user.id:
                    app.logger.warning(f'User {current_user.username} attempted to edit beat {beat_id} without permission')
                    flash('You can only edit your own beats! 🚫', 'error')
                    return redirect(url_for('index'))

                app.logger.info(f'Loading beat {beat_id} for editing 🎵')
                return render_template('synth.html',
                    current_user=current_user,
                    beat=beat.to_dict(),
                    mode='edit',
                    instruments=instruments,
                    presets=presets,
                    default_bpm=beat.bpm
                )

            except Exception as e:
                app.logger.error(f'Error loading beat {beat_id}: {str(e)}')
                flash('Could not load beat... Try again! 😢', 'error')
                return redirect(url_for('index'))

        app.logger.info(f'User {current_user.username} starting new beat 🎹')
        return render_template('synth.html',
            current_user=current_user,
            mode='create',
            default_bpm=128,
            instruments=instruments,
            presets=presets
        )

    except Exception as e:
        app.logger.error(f'Unexpected error in synth route: {str(e)}')
        flash('Beat lab is having a moment... Try again! 🎛️', 'error')
        return redirect(url_for('index'))

@app.route('/upload_beat', methods=['POST'])
@login_required
def upload_beat():
    try:
        beat_data = json.loads(request.form['beat_data'])
        audio_file = request.files['audio_file']
        
        if not audio_file:
            return jsonify({'error': 'No audio file uploaded'}), 400
            
        # Generate unique filename
        filename = generate_unique_filename(audio_file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        audio_file.save(file_path)
        
        # Create new post with enhanced beat data
        post = Post(
            title=beat_data['name'],
            description=beat_data['description'],
            music_file=filename,
            user_id=session['user_id'],
            beat_data=json.dumps(beat_data['pattern']),
            bpm=beat_data['pattern']['bpm'],
            style=beat_data['pattern']['style'],
            effects_data=json.dumps(beat_data['effects']) if 'effects' in beat_data else None,
            is_beat_pattern=True
        )
        
        db.session.add(post)
        db.session.commit()
        
        app.logger.info(f'New beat uploaded by user {session["user_id"]}: {post.title} 🎵')
        
        return jsonify({
            'success': True,
            'post_id': post.id,
            'redirect_url': url_for('profile', username=post.author.username)
        })
        
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error uploading beat: {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/test_beat')
@login_required
def test_beat():
    # Pre-configured test beat with all features
    test_pattern = {
        'bpm': 128,
        'style': 'techno',
        'pattern': {
            'kick': [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
            'snare': [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
            'hihat': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            'synth': {
                'notes': ['C3', 'E3', 'G3', 'B3'],
                'pattern': [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0]
            },
            'effects': {
                'reverb': 0.6,
                'delay': 0.3,
                'distortion': 0.2,
                'filter': {
                    'frequency': 2000,
                    'resonance': 2
                }
            }
        }
    }
    
    app.logger.info('Loading test beat pattern 🎵')
    return render_template('synth.html', test_pattern=test_pattern)

@app.route('/post/<int:post_id>')
def view_post(post_id):
    try:
        post = Post.query.get_or_404(post_id)
        return render_template('post.html', post=post)
    except Exception as e:
        app.logger.error(f'Error viewing post: {str(e)}')
        flash('Post not found or something went wrong! 😢', 'error')
        return redirect(url_for('index'))

@app.route('/post/<int:post_id>/delete', methods=['POST'])
@login_required
def delete_post(post_id):
    try:
        post = Post.query.get_or_404(post_id)
        if post.user_id != session['user_id']:
            flash('You can only delete your own posts! 🚫', 'error')
            return redirect(url_for('profile', username=post.author.username))
            
        # Delete associated file
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], post.music_file)
        if os.path.exists(file_path):
            os.remove(file_path)
            
        db.session.delete(post)
        db.session.commit()
        flash('Post deleted successfully! 🗑️', 'success')
        return redirect(url_for('profile', username=post.author.username))
    except Exception as e:
        db.session.rollback()
        app.logger.error(f'Error deleting post: {str(e)}')
        flash('Something went wrong! Try again later 😢', 'error')
        return redirect(url_for('profile', username=post.author.username))

# Error handlers with style 😎
@app.errorhandler(404)
def not_found_error(error):
    app.logger.warning(f'404 error: {request.url}')
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f'500 error: {error}')
    db.session.rollback()
    return render_template('500.html'), 500

if __name__ == '__main__':
    port = app.config.get('SERVER_PORT', 5001)
    app.logger.info(f'Starting development server on port {port} 🚀')
    app.run(debug=True, port=port, host='127.0.0.1')
