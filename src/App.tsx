import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import toast, { Toaster } from 'react-hot-toast';
import QrDetector from './lib/QrDetector'; // Importing QrDetector from its file
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';


const QRCodeScanner: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const detectorRef = useRef<QrDetector>(new QrDetector()); // Creating an instance of QrDetector
  const [detectedQRCode, setDetectedQRCode] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1); // State for zoom level
  const [xrayActive, setXrayActive] = useState(false); // State for x-ray effect

  useEffect(() => {
    const detectQRCode = async () => {
      const webcam = webcamRef.current?.video;
      if (!webcam || webcam.videoWidth === 0) {
        requestAnimationFrame(detectQRCode);
        return;
      }

      const imageData = captureImageData(webcam);
      const qrCodes = await detectorRef.current.detect(imageData); // Detect QR codes using QrDetector

      if (qrCodes.length > 0) {
        setDetectedQRCode(qrCodes[0].rawValue); // Set the detected QR code value
        toast(`Detected QR Code: ${qrCodes[0].rawValue}`);
      } else {
        setDetectedQRCode(null);
      }

      requestAnimationFrame(detectQRCode);
    };

    detectQRCode();

    return () => {
      // Cleanup function
    };
  }, []);

  const captureImageData = (video: HTMLVideoElement): ImageData => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Canvas context not available');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setZoomLevel(parseFloat(event.target.value)); // Update zoom level state
  };

  const handleXrayToggle = () => {
    setXrayActive(!xrayActive); // Toggle x-ray effect
  };

  return (
    <>
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" enableColorOnDark>
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6"  display="block" margin='0 auto'>
            QRCODE
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Webcam
        ref={webcamRef}
        videoConstraints={{ facingMode: 'environment' }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${zoomLevel})`, // Apply zoom level to the webcam feed
          transformOrigin: 'center center',
          filter: xrayActive ? 'grayscale(100%) invert(100%)' : 'none', // Apply x-ray effect if active
        }}
      />
      <div className="scanner-overlay"></div> {/* Scanner overlay */}
      <div className="zoom-controls" style={{ position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
        <label htmlFor="zoom">Zoom<input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={zoomLevel}
          name='zoom'
          onChange={handleZoomChange}
        />
        </label>
        <br/><br/>
        <Button variant="contained" style={{width: '100%'}} onClick={handleXrayToggle}>{xrayActive ? 'Disable' : 'Enable contrast '}</Button>
      </div>
      <div className="xray-toggle" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2 }}>
      </div>
      <div style={{ position: 'absolute', top: '10%', left: '5%', zIndex: 1, color: 'white' }}>
        <Toaster position="top-center" reverseOrder={false} />
      </div>
    </div>
    </>
  );
};

export default QRCodeScanner;
