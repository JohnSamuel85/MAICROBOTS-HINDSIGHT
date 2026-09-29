import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Recall — Organizational Memory AI',
  description: 'An AI system that learns from previous cases, decisions, actions and outcomes to help solve new problems.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="bg-network-pattern" />
        <div className="bg-network-grid" />

        <div className="app-viewport">
          <header className="app-navbar" role="banner">
            <div className="navbar-container">
              <a href="#" className="brand-logo">
                <div className="brand-icon-wrapper">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 3v3m0 12v3M3 12h3m12 0h3"></path>
                    <path d="m18.364 5.636-2.121 2.121M7.757 16.243l-2.121 2.121M5.636 5.636l2.121 2.121m8.486 8.486 2.121 2.121"></path>
                  </svg>
                </div>
                <span>Recall Memory AI</span>
              </a>

              {/* Hindsight logo and name in right corner */}
              <div className="hindsight-corner-badge" aria-label="Hindsight Memory System">
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="hindsightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0072ff" />
                      <stop offset="100%" stopColor="#00d2c8" />
                    </linearGradient>
                  </defs>

                  {/* Network node tentacles */}
                  <path d="M 14 14 Q 8 7 3 9" stroke="url(#hindsightGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <circle cx="3" cy="9" r="2.2" fill="url(#hindsightGrad)" />
                  
                  <path d="M 18 11 Q 15 4 10 3" stroke="url(#hindsightGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <circle cx="10" cy="3" r="2.2" fill="url(#hindsightGrad)" />

                  <path d="M 26 14 Q 32 7 37 9" stroke="url(#hindsightGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <circle cx="37" cy="9" r="2.2" fill="url(#hindsightGrad)" />
                  
                  <path d="M 22 11 Q 25 4 30 3" stroke="url(#hindsightGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <circle cx="30" cy="3" r="2.2" fill="url(#hindsightGrad)" />

                  <path d="M 14 26 Q 8 33 3 31" stroke="url(#hindsightGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <circle cx="3" cy="31" r="2.2" fill="url(#hindsightGrad)" />
                  
                  <path d="M 18 29 Q 15 36 10 37" stroke="url(#hindsightGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <circle cx="10" cy="37" r="2.2" fill="url(#hindsightGrad)" />

                  <path d="M 26 26 Q 32 33 37 31" stroke="url(#hindsightGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <circle cx="37" cy="31" r="2.2" fill="url(#hindsightGrad)" />
                  
                  <path d="M 22 29 Q 25 36 30 37" stroke="url(#hindsightGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <circle cx="30" cy="37" r="2.2" fill="url(#hindsightGrad)" />

                  {/* Central Eye node */}
                  <ellipse cx="20" cy="20" rx="9" ry="6" stroke="url(#hindsightGrad)" strokeWidth="2.5" fill="none" />
                  <circle cx="20" cy="20" r="3" fill="url(#hindsightGrad)" />
                </svg>
                <span className="hindsight-text">
                  <span className="hindsight-hind">Hind</span>
                  <span className="hindsight-sight">sight</span>
                </span>
              </div>
            </div>
          </header>
          
          <main className="main-content" role="main">
            <div className="demo-container">
              {children}
            </div>
          </main>

          <footer className="app-footer" role="contentinfo">
            <div>
              Powered by <span className="footer-link-pill">Hindsight Vector Memory</span> & <span className="footer-link-pill">Google Gemini AI</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
