import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FiX, FiCheckCircle } from 'react-icons/fi';

const QRModal = ({ isOpen, onClose, sessionId, isVerified }) => {
    if (!isOpen) { return null; }

    // The data payload for the QR code, which the Mobile app will read
    // Structure typically matches what the mobile app expects
    const qrData = JSON.stringify({
        type: 'session_verification',
        sessionId: sessionId,
        timestamp: new Date().toISOString()
    });

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-auto shadow-2xl relative animate-scale-up">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <FiX className="w-5 h-5" />
                </button>

                <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Session Verification</h3>

                    {isVerified ? (
                        <div className="py-8 flex flex-col items-center">
                            <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mb-4">
                                <FiCheckCircle className="w-10 h-10 text-success-500" />
                            </div>
                            <p className="text-lg font-semibold text-success-600 mb-1">Face-to-Face Verified!</p>
                            <p className="text-gray-500 text-sm">You can now start the session.</p>
                            <button
                                onClick={onClose}
                                className="mt-6 btn btn-primary w-full"
                            >
                                Start Session
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-500 text-sm mb-8">
                                Ask your client to open the BioSync mobile app and scan this QR code to confirm face-to-face attendance.
                            </p>

                            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm inline-block mb-6">
                                {sessionId ? (
                                    <QRCodeSVG
                                        value={qrData}
                                        size={200}
                                        level="H" // High error correction
                                        includeMargin={false}
                                    />
                                ) : (
                                    <div className="w-[200px] h-[200px] bg-gray-50 flex items-center justify-center rounded-xl animate-pulse">
                                        <span className="text-gray-400 text-sm font-medium">Generating...</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-center gap-2 text-sm text-primary-600 font-medium">
                                <div className="loading-spinner w-4 h-4 border-2"></div>
                                <span>Waiting for client to scan...</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRModal;
