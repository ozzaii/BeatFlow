#!/usr/bin/env python3
import os
import shutil
import json
from pathlib import Path
import subprocess
from concurrent.futures import ThreadPoolExecutor

class Builder:
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent
        self.dist_dir = self.root_dir / 'dist'
        self.static_dir = self.root_dir / 'static'
        self.templates_dir = self.root_dir / 'templates'
        
        # Ensure clean dist directory
        if self.dist_dir.exists():
            shutil.rmtree(self.dist_dir)
        self.dist_dir.mkdir(parents=True)
        
    def build(self):
        """Run the complete build process"""
        print("🚀 Starting build process...")
        
        try:
            # Create necessary directories
            self.create_directories()
            
            # Process static assets
            with ThreadPoolExecutor() as executor:
                executor.submit(self.process_styles)
                executor.submit(self.process_scripts)
                executor.submit(self.process_images)
            
            # Generate service worker
            self.generate_service_worker()
            
            # Copy and process templates
            self.process_templates()
            
            # Copy other necessary files
            self.copy_additional_files()
            
            print("✨ Build completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ Build failed: {str(e)}")
            return False
            
    def create_directories(self):
        """Create necessary directories in dist"""
        print("📁 Creating directories...")
        
        # Create static directories
        (self.dist_dir / 'static' / 'css').mkdir(parents=True)
        (self.dist_dir / 'static' / 'js').mkdir(parents=True)
        (self.dist_dir / 'static' / 'img').mkdir(parents=True)
        (self.dist_dir / 'static' / 'fonts').mkdir(parents=True)
        
    def process_styles(self):
        """Process and optimize CSS files"""
        print("🎨 Processing styles...")
        
        # Copy minified CSS
        css_dir = self.static_dir / 'css'
        dist_css_dir = self.dist_dir / 'static' / 'css'
        
        for css_file in css_dir.rglob('*.min.css'):
            shutil.copy2(css_file, dist_css_dir)
            
        # Combine component CSS
        component_css = []
        for css_file in (css_dir / 'components').glob('*.css'):
            with open(css_file) as f:
                component_css.append(f.read())
                
        if component_css:
            combined_css = '\n'.join(component_css)
            with open(dist_css_dir / 'components.min.css', 'w') as f:
                f.write(combined_css)
                
    def process_scripts(self):
        """Process and optimize JavaScript files"""
        print("📜 Processing scripts...")
        
        # Copy minified JS
        js_dir = self.static_dir / 'js'
        dist_js_dir = self.dist_dir / 'static' / 'js'
        
        for js_file in js_dir.rglob('*.min.js'):
            shutil.copy2(js_file, dist_js_dir)
            
        # Combine component JS
        component_js = []
        for js_file in (js_dir / 'components').glob('*.js'):
            with open(js_file) as f:
                component_js.append(f.read())
                
        if component_js:
            combined_js = '\n'.join(component_js)
            with open(dist_js_dir / 'components.min.js', 'w') as f:
                f.write(combined_js)
                
    def process_images(self):
        """Optimize and copy images"""
        print("🖼️ Processing images...")
        
        img_dir = self.static_dir / 'img'
        dist_img_dir = self.dist_dir / 'static' / 'img'
        
        # Copy all images
        for img_file in img_dir.rglob('*'):
            if img_file.is_file():
                shutil.copy2(img_file, dist_img_dir)
                
    def generate_service_worker(self):
        """Generate service worker with precache manifest"""
        print("🔧 Generating service worker...")
        
        # Get list of static files to precache
        precache_files = []
        
        for root, _, files in os.walk(self.dist_dir / 'static'):
            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, self.dist_dir)
                precache_files.append(f'/{relative_path}')
                
        # Add core app files
        precache_files.extend([
            '/',
            '/index.html',
            '/manifest.json'
        ])
        
        # Create service worker content
        sw_content = f"""
            const CACHE_NAME = 'beatflow-v1';
            const PRECACHE_URLS = {json.dumps(precache_files, indent=2)};
            
            self.addEventListener('install', event => {{
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then(cache => cache.addAll(PRECACHE_URLS))
                );
            }});
            
            self.addEventListener('activate', event => {{
                event.waitUntil(
                    caches.keys().then(cacheNames => {{
                        return Promise.all(
                            cacheNames.map(cacheName => {{
                                if (cacheName !== CACHE_NAME) {{
                                    return caches.delete(cacheName);
                                }}
                            }})
                        );
                    }})
                );
            }});
            
            self.addEventListener('fetch', event => {{
                event.respondWith(
                    caches.match(event.request)
                        .then(response => {{
                            if (response) {{
                                return response;
                            }}
                            return fetch(event.request);
                        }})
                );
            }});
        """
        
        with open(self.dist_dir / 'sw.js', 'w') as f:
            f.write(sw_content)
            
    def process_templates(self):
        """Process and copy HTML templates"""
        print("📄 Processing templates...")
        
        # Copy and process templates
        for template in self.templates_dir.rglob('*.html'):
            relative_path = template.relative_to(self.templates_dir)
            dest_path = self.dist_dir / relative_path
            
            # Ensure parent directory exists
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy and process template
            with open(template) as src, open(dest_path, 'w') as dest:
                content = src.read()
                # Replace template variables with production values
                content = content.replace('{{ url_for(', '/static/')
                dest.write(content)
                
    def copy_additional_files(self):
        """Copy additional necessary files"""
        print("📋 Copying additional files...")
        
        # Copy manifest
        shutil.copy2(self.static_dir / 'manifest.json', self.dist_dir)
        
        # Copy robots.txt
        with open(self.dist_dir / 'robots.txt', 'w') as f:
            f.write("""
                User-agent: *
                Allow: /
                
                Sitemap: https://beatflow.app/sitemap.xml
            """)
            
        # Copy favicon
        shutil.copy2(self.static_dir / 'img' / 'favicon.png', self.dist_dir)
        
        # Generate sitemap
        self.generate_sitemap()
        
    def generate_sitemap(self):
        """Generate sitemap.xml"""
        sitemap_content = """<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <url>
                <loc>https://beatflow.app/</loc>
                <changefreq>daily</changefreq>
                <priority>1.0</priority>
            </url>
            <url>
                <loc>https://beatflow.app/explore</loc>
                <changefreq>daily</priority>
                <priority>0.8</priority>
            </url>
            <url>
                <loc>https://beatflow.app/synth</loc>
                <changefreq>weekly</changefreq>
                <priority>0.8</priority>
            </url>
        </urlset>
        """
        
        with open(self.dist_dir / 'sitemap.xml', 'w') as f:
            f.write(sitemap_content)

if __name__ == '__main__':
    builder = Builder()
    success = builder.build()
    exit(0 if success else 1) 