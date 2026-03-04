import '@aws-amplify/ui-react-liveness/styles.css';
import '@aws-amplify/ui-react/styles.css';
import { Amplify } from 'aws-amplify';
import { useState } from 'react';
import './App.css';
import { LivenessDetector } from './components/LivenessDetector';

// Initialize Amplify with custom AWS IAM credentials (for testing only)
// WARNING: Hardcoding AWS credentials in a frontend app is insecure and should NEVER be done in production.
// This is strictly for local development testing.
Amplify.configure({}, {
  Auth: {
    credentialsProvider: {
      getCredentialsAndIdentityId: async () => ({
        credentials: {
          accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '', // Replace or use .env files
          secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '', // Replace or use .env files
        }
      }),
      clearCredentialsAndIdentityId: () => {
        // No-op
      }
    }
  }
});

function App() {
  const [livenessResult, setLivenessResult] = useState<{ isLive: boolean } | null>(null);
  const [error, setError] = useState<any>(null);

  const resetLivenessCheck = () => {
    setLivenessResult(null);
    setError(null);
  };

  const handleAnalysisComplete = (isLive: boolean) => {
    setLivenessResult({ isLive });
  };

  const handleError = (err: any) => {
    setError(err);
  };

  const handleUserCancel = () => {
    setError(new Error("User cancelled liveness check"));
  };

  return (
    <div className="app-container">
      <main className="app-main">
        {error && (
          <div className="error-message">
            <p>Error during liveness check. Please try again.</p>
          </div>
        )}

        {!livenessResult && !error ? (
          <div className="liveness-wrapper">
            <LivenessDetector
              onAnalysisComplete={handleAnalysisComplete}
              onAnalysisError={handleError}
              onUserCancel={handleUserCancel}
            />
          </div>
        ) : (
          <div className="intro-section">
            <div className="result-container">
              {livenessResult && (
                <div className={`result-box ${livenessResult.isLive ? 'success' : 'failure'}`}>
                  <h2>{livenessResult.isLive ? 'Live Person Detected! ✅' : 'Spoofing Detected ❌'}</h2>
                </div>
              )}
            </div>
            
            <div className="action-card">
              <button className="primary-button" onClick={resetLivenessCheck}>
                Test Again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
