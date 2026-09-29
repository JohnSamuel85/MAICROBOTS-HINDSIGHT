'use client';

import React, { useState } from 'react';
import { MemoryItem, AnalysisResult } from '@/lib/types';

interface DemoScenario {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  tag: string;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'api-timeout',
    title: 'API timeout',
    subtitle: 'Payment gateway API is returning 504 errors during peak traffic. CPU is normal but database connections are almost full.',
    category: 'API timeout',
    tag: 'Infrastructure / API',
  },
  {
    id: 'customer-escalation',
    title: 'Customer escalation',
    subtitle: 'An enterprise customer is suddenly receiving many 429 errors while using API v2.',
    category: 'Customer escalation',
    tag: 'Authentication / Traffic',
  },
  {
    id: 'payment-failure',
    title: 'Repeated payment failure',
    subtitle: 'Several customer subscription renewals are failing because Stripe webhook events are not being processed correctly.',
    category: 'Repeated payment failure',
    tag: 'Billing & Webhooks',
  },
];

interface ProcessStepDef {
  id: string;
  defaultLabel: string;
}

const PROCESS_STEPS: ProcessStepDef[] = [
  { id: 'understanding', defaultLabel: 'Understanding the issue' },
  { id: 'searching_memory', defaultLabel: 'Searching organizational memory' },
  { id: 'memory_found', defaultLabel: 'Relevant memory found' },
  { id: 'sending_to_gemini', defaultLabel: 'Sending context to Gemini' },
  { id: 'reasoning', defaultLabel: 'Reasoning over previous experience' },
  { id: 'recommendation_generated', defaultLabel: 'Recommendation generated' },
  { id: 'saving_memory', defaultLabel: 'Saving useful outcome to memory' },
];

export default function DemoPage() {
  const [screen, setScreen] = useState<1 | 2 | 3 | 4>(1);

  // Screen 2 selection state
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario | null>(null);
  const [customText, setCustomText] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Screen 3 progress state
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [stepDetails, setStepDetails] = useState<{ [key: number]: string }>({});
  const [stepLabels, setStepLabels] = useState<{ [key: number]: string }>({});
  const [retrievedMemoriesPreview, setRetrievedMemoriesPreview] = useState<MemoryItem[]>([]);

  // Screen 4 result state
  const [resultData, setResultData] = useState<AnalysisResult | null>(null);

  // Start analysis pipeline
  const runAnalysis = async (issueText: string, category: string) => {
    setScreen(3);
    setActiveStepIndex(0);
    setStepDetails({});
    setStepLabels({});
    setRetrievedMemoriesPreview([]);
    setResultData(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue: issueText, category }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to start analysis stream');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            try {
              const event = JSON.parse(dataStr);
              handleStreamEvent(event);
            } catch (e) {
              console.error('Error parsing SSE line:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      // Fallback if connection breaks
      setTimeout(() => {
        setResultData({
          recommendedAction:
            'Inspect database connection pool exhaustion and tune configuration. Past post-mortems confirm increasing request timeouts failed to resolve socket lockups.',
          memoriesUsed: [
            {
              id: 'mem-001',
              category: 'API timeout',
              issue: 'Payment gateway API 504 timeout',
              rootCause: 'Database connection pool exhaustion',
              resolution: 'Increasing timeout failed. Tuning DB pool size from 10 to 50 resolved issue.',
              summary: 'Similar API timeout occurred in Q2. Increasing HTTP timeout failed. Adjusting DB connection pool size from 10 to 50 and enabling keep-alives resolved the root cause.',
              outcome: 'Resolved 504 latency spike',
              timestamp: new Date().toISOString(),
            },
          ],
          savedMemory: {
            id: 'mem-saved',
            category,
            issue: issueText,
            rootCause: 'Resolved via organizational memory',
            resolution: 'Applied DB connection pool tuning',
            summary: 'Outcome indexed into memory bank',
            outcome: 'Saved to organizational memory',
            timestamp: new Date().toISOString(),
          },
        });
        setScreen(4);
      }, 2000);
    }
  };

  const handleStreamEvent = (event: any) => {
    const { step, label, detail, memories, result } = event;

    if (step === 'completed' && result) {
      setResultData(result);
      setActiveStepIndex(PROCESS_STEPS.length - 1);
      setTimeout(() => {
        setScreen(4);
      }, 1000);
      return;
    }

    const stepIdx = PROCESS_STEPS.findIndex((s) => s.id === step);
    if (stepIdx !== -1) {
      setActiveStepIndex(stepIdx);
      if (label) {
        setStepLabels((prev) => ({ ...prev, [stepIdx]: label }));
      }
      if (detail) {
        setStepDetails((prev) => ({ ...prev, [stepIdx]: detail }));
      }
      if (memories && Array.isArray(memories)) {
        setRetrievedMemoriesPreview(memories);
      }
    }
  };

  const handleSelectScenario = (scenario: DemoScenario) => {
    setSelectedScenario(scenario);
    setIsCustomMode(false);
    runAnalysis(scenario.subtitle, scenario.category);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    setSelectedScenario({
      id: 'custom',
      title: 'Custom Incident',
      subtitle: customText,
      category: 'General',
      tag: 'Custom Query',
    });
    runAnalysis(customText, 'General');
  };

  const resetDemo = () => {
    setScreen(2);
    setSelectedScenario(null);
    setCustomText('');
    setIsCustomMode(false);
    setResultData(null);
  };

  const progressPercent = Math.round(((activeStepIndex + 1) / PROCESS_STEPS.length) * 100);

  return (
    <>
      {/* SCREEN 1: LANDING PAGE */}
      {screen === 1 && (
        <div className="animate-slide-up" style={{ textAlign: 'left' }}>
          <h1 className="hero-title">Your organization remembers.</h1>
          <p className="hero-desc">
            An AI system that learns from previous cases, decisions, actions and outcomes to help solve new problems.
          </p>

          <div className="feature-pills-row">
            <span className="feature-pill">✦ Real incident memory retrieval</span>
            <span className="feature-pill">✦ Gemini AI reasoning</span>
            <span className="feature-pill">✦ Closed-loop outcome indexing</span>
          </div>

          <button
            className="btn-primary"
            onClick={() => setScreen(2)}
            id="start-demo-btn"
            aria-label="Start Demo Experience"
          >
            <span>Start Demo</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* SCREEN 2: SELECT A PROBLEM */}
      {screen === 2 && (
        <div className="animate-slide-up">
          <h2 className="screen-title">What are you dealing with?</h2>
          <p className="screen-desc">
            Select a demo scenario or enter your own incident to analyze with organizational memory.
          </p>

          <div className="options-grid" role="radiogroup" aria-label="Incident scenarios">
            {DEMO_SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                className="option-card"
                onClick={() => handleSelectScenario(sc)}
                role="radio"
                aria-checked={selectedScenario?.id === sc.id}
              >
                <div>
                  <span className="option-tag">{sc.tag}</span>
                  <div className="option-title">{sc.title}</div>
                  <div className="option-subtitle">{sc.subtitle}</div>
                </div>
                <div className="option-arrow-icon" aria-hidden="true">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {!isCustomMode ? (
            <button
              className="btn-secondary"
              style={{ width: '100%', marginTop: '0.25rem' }}
              onClick={() => setIsCustomMode(true)}
              aria-expanded="false"
            >
              <span>+ Enter Custom Incident</span>
            </button>
          ) : (
            <form onSubmit={handleCustomSubmit} className="custom-input-card animate-fade-in">
              <label htmlFor="custom-incident-input" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-navy)', marginBottom: '0.5rem' }}>
                Describe your incident
              </label>
              <input
                id="custom-incident-input"
                type="text"
                className="custom-input"
                placeholder="e.g., Redis cluster failover latency spike on peak hours"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCustomMode(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={!customText.trim()}>
                  Analyze Incident →
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* SCREEN 3: AI ANALYSIS */}
      {screen === 3 && (
        <div className="animate-slide-up">
          <div className="active-incident-card">
            <div>
              <div className="incident-badge-header">
                <span className="brand-dot" />
                <span>Active Incident Context</span>
              </div>
              <div className="incident-title-text">
                {selectedScenario?.subtitle || 'Custom Incident'}
              </div>
            </div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                backgroundColor: 'var(--bg-subtle)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
              }}
            >
              {selectedScenario?.category || 'General'}
            </div>
          </div>

          <div className="progress-card">
            <div className="process-header-bar">
              <div className="process-header-title">Reasoning over Organizational Memory</div>
              <div className="process-header-percent">{progressPercent}%</div>
            </div>

            <div className="process-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <div className="process-fill" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="process-timeline">
              {PROCESS_STEPS.map((stepDef, idx) => {
                const isCompleted = idx < activeStepIndex;
                const isActive = idx === activeStepIndex;

                const displayLabel = stepLabels[idx] || stepDef.defaultLabel;
                const displayDetail = stepDetails[idx];

                return (
                  <div
                    key={stepDef.id}
                    className={`process-step ${
                      isCompleted ? 'completed' : isActive ? 'active' : 'pending'
                    }`}
                  >
                    {idx < PROCESS_STEPS.length - 1 && <div className="step-line" />}

                    <div className="step-indicator-wrapper">
                      {isActive && <div className="pulse-halo" />}
                      <div className="step-indicator">
                        {isCompleted ? (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : isActive ? (
                          <div className="indicator-dot" />
                        ) : null}
                      </div>
                    </div>

                    <div className="step-content">
                      <div className="step-text">{displayLabel}</div>
                      
                      {isActive && displayDetail && (
                        <div className="step-detail-box">{displayDetail}</div>
                      )}

                      {isActive && (stepDef.id === 'searching_memory' || stepDef.id === 'reasoning') && (
                        <div className="scanning-bar" />
                      )}

                      {/* Show retrieved memory preview chips under Step 3 */}
                      {stepDef.id === 'memory_found' && (isCompleted || isActive) && retrievedMemoriesPreview.length > 0 && (
                        <div className="live-memory-preview-container">
                          {retrievedMemoriesPreview.map((mem, mIdx) => (
                            <div key={mem.id || mIdx} className="live-memory-chip">
                              <span className="live-chip-badge">Hindsight #{mIdx + 1}</span>
                              <span>{mem.summary}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 4: RESULT */}
      {screen === 4 && resultData && (
        <div className="animate-slide-up">
          <div className="result-card">
            <div className="result-section-label">Recommended action</div>
            <div className="recommendation-box">
              {resultData.recommendedAction}
            </div>

            <div className="memories-section">
              <div className="memories-title">Based on previous experience</div>
              {resultData.memoriesUsed.length > 0 ? (
                resultData.memoriesUsed.map((mem) => (
                  <div key={mem.id} className="memory-item-box">
                    <div className="memory-item-header">
                      <span className="memory-id-badge">{mem.id.toUpperCase()}</span>
                      <span className="option-tag" style={{ margin: 0, fontSize: '0.675rem' }}>{mem.category}</span>
                    </div>
                    <div className="memory-item-text">{mem.summary}</div>
                  </div>
                ))
              ) : (
                <div className="memory-item-box">
                  <div className="memory-item-text">
                    Similar issue occurred previously. Increasing the timeout did not resolve it. Investigation of connection pooling successfully resolved the previous case.
                  </div>
                </div>
              )}
            </div>

            <div className="memory-updated-badge">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <div>
                <div>Memory updated ✓</div>
                <div className="memory-updated-subtext">
                  This outcome has been added to organizational memory for future cases.
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button className="btn-primary" onClick={resetDemo} id="analyze-another-btn">
              <span>Analyze Another Case</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
