'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, Link as LinkIcon, Loader2, Play, Info as InfoIcon, Clipboard } from 'lucide-react';
import SpiderVerseBackground from '@/components/SpiderVerseBackground';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const lastFetchedUrl = useRef<string>('');

  const fetchReelInfo = async (targetUrl: string) => {
    if (!targetUrl || targetUrl === lastFetchedUrl.current) return;

    // Basic Instagram URL validation
    if (!targetUrl.includes('instagram.com/reel') && !targetUrl.includes('instagram.com/reels')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    lastFetchedUrl.current = targetUrl;

    try {
      const response = await fetch(`/api/fetch-reel?url=${encodeURIComponent(targetUrl)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video information');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch trigger when URL changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReelInfo(url);
    }, 500); // Small debounce

    return () => clearTimeout(timer);
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      setError('Clipboard access denied. Please paste manually.');
    }
  };

  const handleDownload = async () => {
    if (!result) return;

    const videoUrl = result.video_url;
    if (!videoUrl) return;

    const downloadUrl = `/api/download?url=${encodeURIComponent(videoUrl)}&filename=instareel_${Date.now()}.mp4`;
    window.location.href = downloadUrl;
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', position: 'relative' }}>
      <SpiderVerseBackground />

      <div style={{ zIndex: 10, width: '100%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 className="hero-title">InstaReel <span className="text-glow">Downloader</span></h1>
          <p className="hero-subtitle">free instagram reel downloader No Watermark</p>
        </header>

        <div className="search-wrapper">
          <div className="search-glow"></div>
          <div className="search-box">
            <div className="search-icon">
              {loading ? <Loader2 className="spinner" size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} /> : <LinkIcon size={20} />}
            </div>
            <input
              type="text"
              className="search-input"
              placeholder="Paste Instagram Reel link here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="paste-btn"
              onClick={handlePaste}
              title="Paste from clipboard"
            >
              <Clipboard size={18} />
              <span>PASTE LINK</span>
            </button>
          </div>
          {loading && (
            <div className="loading-bar-container">
              <div className="loading-bar-progress"></div>
            </div>
          )}
        </div>

        {error && (
          <div className="error-card">
            <InfoIcon size={16} />
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="result-container">
            <div className="result-card">
              <div className="video-preview">
                {result.thumbnail ? (
                  <img
                    src={`/api/proxy?url=${encodeURIComponent(result.thumbnail)}`}
                    alt="Thumbnail"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.8), transparent)', zIndex: 1 }}></div>
                )}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  <Play style={{ color: 'rgba(255,255,255,0.6)' }} size={48} />
                </div>
              </div>

              <div className="video-info">
                <h3>{result.title?.length > 40 ? result.title.substring(0, 40) + '...' : result.title}</h3>
                <p className="status-badge" style={{ marginTop: '0.5rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                  {result.title?.length > 40 ? result.title : 'Ready for extraction'}
                </p>

                <div className="action-btns">
                  <button
                    onClick={handleDownload}
                    className="save-protocol"
                  >
                    <Download size={18} />
                    SAVE VIDEO
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="footer-v2">
        &copy; {new Date().getFullYear()} • InstaReel Downloader • Premium Experience
      </footer>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes loading-anim {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </main>
  );
}
