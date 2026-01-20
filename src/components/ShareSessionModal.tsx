import React, { useState, useEffect } from 'react';

interface ShareSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onGenerateLink: () => Promise<string>;
  isLoading: boolean;
}

const ShareSessionModal: React.FC<ShareSessionModalProps> = ({
  isOpen,
  onClose,
  onGenerateLink,
  isLoading
}) => {
  const [accessCode, setAccessCode] = useState<string>('');
  const [link, setLink] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && accessCode) {
      const baseUrl = window.location.origin;
      const newLink = `${baseUrl}/session/join/${accessCode}`;
      setLink(newLink);
    }
  }, [accessCode, isOpen]);

  const handleGenerateLink = async () => {
    try {
      const code = await onGenerateLink();
      setAccessCode(code);
    } catch (error) {
      console.error('Error generating access code:', error);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-slideUp">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Share Session</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-transform transform hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {!accessCode ? (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">Generate a link to invite others to your session</p>
              <button
                onClick={handleGenerateLink}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md text-white font-medium transition-transform transform ${
                  isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
                }`}
              >
                {isLoading ? 'Generating...' : 'Generate Share Link'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Shareable Link */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Shareable Link:</p>
                <div className="flex  items-center">
                  <input
                    type="text"
                    value={link}
                    readOnly
                    className="flex-1 border border-gray-300 text-black rounded-l px-3 py-2 text-sm truncate focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`bg-blue-600 text-white px-4 py-2 rounded-r font-medium text-sm transition-transform transform hover:scale-105 hover:bg-blue-700`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 space-y-1">
                <h3 className="font-medium text-blue-800 mb-2">How to use:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Send this link to people you want to collaborate with</li>
                  <li>They'll need to log in to join your session</li>
                  <li>They'll have the same access as you do</li>
                </ul>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium transition-transform transform hover:scale-105"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareSessionModal;
