import { ThemeProvider } from '@aws-amplify/ui-react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import React, { useEffect, useState } from 'react';
import { postMessageToWebView } from "../utils/webView";

interface LivenessDetectorProps {
  onAnalysisStart?: () => void;
  onAnalysisComplete?: (isLive: boolean) => void;
  onAnalysisError?: (error: any) => void;
  onUserCancel?: () => void;
}

export const LivenessDetector: React.FC<LivenessDetectorProps> = ({
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisError,
  onUserCancel
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://aws-face-api.vercel.app/api/create-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSessionId(data.sessionId);
      } catch (error) {
        console.error("Failed to fetch session ID", error);
        if (onAnalysisError) onAnalysisError(error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [onAnalysisError]);

  const handleAnalysisComplete = async () => {
    if (onAnalysisStart) onAnalysisStart();
    console.log("Analysis completed by FaceLivenessDetector component.");
    
    try {
      const response = await fetch(`https://aws-face-api.vercel.app/api/get-results/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get results: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Liveness result:", data);

      // Send a message to the native mobile app wrapping this webview
      postMessageToWebView({ sessionId, data });

      // Send custom URL scheme value
      const isLiveValue = data?.isLive ?? false;
      window.location.href = `authnex.face.rekognition://liveness?sessionId=${sessionId}&isLive=${isLiveValue}`;
      
      if (onAnalysisComplete) {
        // We will pass the 'isLive' property. Adjust this if the API returns a different structure.
        onAnalysisComplete(!!data.isLive);
      }
    } catch (error) {
      console.error("Failed to get analysis results", error);
      if (onAnalysisError) onAnalysisError(error);
    }
  };

  if (isLoading) {
    return (
      <div className="liveness-loading-container">
        <div className="spinner"></div>
        <p>Initializing Liveness Session...</p>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="liveness-error-container">
        <p>Failed to initialize liveness session. Please try again.</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className="liveness-detector-container">
        <FaceLivenessDetector
          sessionId={sessionId}
          region="us-east-1" // Replace with your AWS region
          disableStartScreen={true}
          onAnalysisComplete={handleAnalysisComplete}
          onError={(error) => {
            console.error(error);
            if (onAnalysisError) onAnalysisError(error);
          }}
          onUserCancel={() => {
            console.log("User cancelled liveness check");
            if (onUserCancel) onUserCancel();
          }}
        />
      </div>
    </ThemeProvider>
  );
};
