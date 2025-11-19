import { Download, RotateCcw } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { useEffect, useRef, useState } from 'react';
import { ConversationLog } from './components/ConversationLog';
import { PDFUploader } from './components/PDFUploader';
import { PDFViewer } from './components/PDFViewer';
import { VoiceAgent } from './components/VoiceAgent';

// Polyfill for SpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface FormField {
  name: string;
  type: string;
  value: string;
  ref: any;
}

interface Message {
  role: 'agent' | 'user';
  text: string;
  timestamp: number;
}

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [currentFieldIndex, setCurrentFieldIndex] = useState<number>(-1);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  // Refs to access latest state in callbacks/effects without triggering re-renders
  const fieldsRef = useRef<FormField[]>([]);
  const autoModeRef = useRef(false);
  const isDemoModeRef = useRef(false);
  const pdfDocRef = useRef<PDFDocument | null>(null);

  // Sync refs with state
  useEffect(() => { fieldsRef.current = fields; }, [fields]);
  useEffect(() => { autoModeRef.current = autoMode; }, [autoMode]);
  useEffect(() => { isDemoModeRef.current = isDemoMode; }, [isDemoMode]);
  useEffect(() => { pdfDocRef.current = pdfDoc; }, [pdfDoc]);

  const mockData: Record<string, string> = {
    "Vehicle weight": "15000",
    "Unload weight": "5000",
    "Dockage": "200",
    "Net weight": "9800",
    "Producers name and address surname first and farm name if applicable": "Doe, John - Green Acres Farm",
    "Date of issue yyyymmdd": "20251119",
    "Delivery date yyyymmdd": "20251118",
    "Delivery location": "Saskatoon Elevator",
    "Contract reference if applicable": "CTR-2025-001",
    "Scale ticket no": "ST-998877",
    "Grain": "Wheat",
    "Price per net tonne": "350",
    "Dockage_2": "200",
    "Grade": "1",
    "Total purchase price": "3430",
    "Levy deductible": "30",
    "Net amount payable": "3400",
    "Net weight in words if applicableProducers copy NOT NEGOTIABLE": "Nine thousand eight hundred",
    "undefined_3": "Authorized Signature",
    "undefined_4": "No additional notes"
  };

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const agentVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const userVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Initialize Speech Recognition and Voice Selection
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setLastTranscript(transcript);
        handleVoiceInput(transcript);
      };

      recognitionRef.current = recognition;
    }

    // Select voices for agent and user
    const selectVoices = () => {
      const voices = synthRef.current.getVoices();
      if (voices.length === 0) return;

      // Try to find a female voice for the agent
      const agentVoice = voices.find(v =>
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('victoria')
      ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

      // Try to find a male voice for the user
      const userVoice = voices.find(v =>
        v.name.toLowerCase().includes('alex') ||
        v.name.toLowerCase().includes('male') ||
        v.name.toLowerCase().includes('david') ||
        v.name.toLowerCase().includes('mark')
      ) || voices.find(v => v.lang.startsWith('en') && v !== agentVoice) || voices[1] || voices[0];

      agentVoiceRef.current = agentVoice;
      userVoiceRef.current = userVoice;
      console.log('[Voice] Agent voice:', agentVoice.name);
      console.log('[Voice] User voice:', userVoice.name);
    };

    // Voices might not be loaded immediately
    if (synthRef.current.getVoices().length > 0) {
      selectVoices();
    }
    synthRef.current.addEventListener('voiceschanged', selectVoices);

    return () => {
      synthRef.current.removeEventListener('voiceschanged', selectVoices);
    };
  }, []); // Empty dependency array to run once

  // Function to update a PDF field and re-render
  const updatePDFField = async (fieldName: string, value: string) => {
    if (!pdfDocRef.current) return;

    try {
      const form = pdfDocRef.current.getForm();
      const field = form.getTextField(fieldName);
      if (field) {
        field.setText(value);
        console.log(`[PDF Update] Updated field "${fieldName}" with value: ${value}`);

        // Save and update bytes to trigger re-render
        const bytes = await pdfDocRef.current.save();
        setPdfBytes(bytes);
      }
    } catch (e) {
      console.error(`[PDF Update] Error updating field ${fieldName}:`, e);
    }
  };

  // Load PDF and extract fields
  const handleFileUpload = async (uploadedFile: File) => {
    console.log('[PDF Upload] Starting upload for file:', uploadedFile.name);
    setFile(uploadedFile);

    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      console.log('[PDF Upload] ArrayBuffer loaded, size:', arrayBuffer.byteLength);

      const pdfDoc = await PDFDocument.load(arrayBuffer);
      console.log('[PDF Upload] PDF document loaded successfully');

      // Store PDF document in state
      setPdfDoc(pdfDoc);

      // Get initial bytes for rendering
      const initialBytes = await pdfDoc.save();
      setPdfBytes(initialBytes);

      const form = pdfDoc.getForm();
      const formFields = form.getFields();
      console.log('[PDF Upload] Total form fields found:', formFields.length);

      // Log the actual types we're seeing
      const fieldTypes = formFields.map(f => f.constructor.name);
      console.log('[PDF Upload] Field types:', [...new Set(fieldTypes)]);

      const extractedFields = formFields.map(f => ({
        name: f.getName(),
        type: f.constructor.name,
        value: '',
        ref: f
      })); // Accept all fields, not just PDFTextField

      console.log('[PDF Upload] Fields extracted:', extractedFields.length);
      console.log('[PDF Upload] Field names:', extractedFields.map(f => f.name));

      setFields(extractedFields);
      // Note: fieldsRef will update in the useEffect above

      if (extractedFields.length > 0) {
        speak(`I found ${extractedFields.length} fields. Say "Start" to begin filling.`);
      } else {
        speak("I couldn't find any fillable text fields in this PDF.");
      }
    } catch (error) {
      console.error('[PDF Upload] Error loading PDF:', error);
      speak("Sorry, I encountered an error loading this PDF.");
    }
  };

  const loadDemoPDF = async () => {
    console.log('[Demo] Loading demo PDF...');
    try {
      const response = await fetch('/grain-receipt-en.pdf');
      console.log('[Demo] Fetch response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('[Demo] Blob created, size:', blob.size, 'type:', blob.type);

      const file = new File([blob], "grain-receipt-en.pdf", { type: "application/pdf" });
      console.log('[Demo] File object created, calling handleFileUpload...');

      await handleFileUpload(file);
      console.log('[Demo] handleFileUpload completed');
    } catch (e) {
      console.error("[Demo] Failed to load demo PDF", e);
      alert("Failed to load demo PDF. Make sure it is in the public folder.");
    }
  };

  const runDemo = () => {
    if (fieldsRef.current.length === 0) {
      alert("Please wait for the PDF to load and fields to be extracted.");
      return;
    }
    setIsDemoMode(true);
    setMessages([]); // Clear previous chat
    setCurrentFieldIndex(0);
    setAutoMode(true);
  };

  const addMessage = (role: 'agent' | 'user', text: string) => {
    setMessages(prev => [...prev, { role, text, timestamp: Date.now() }]);
  };

  const speak = (text: string, callback?: () => void, speaker: 'agent' | 'user' = 'agent') => {
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    addMessage(speaker, text);
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);

    // Set the appropriate voice
    if (speaker === 'agent' && agentVoiceRef.current) {
      utterance.voice = agentVoiceRef.current;
    } else if (speaker === 'user' && userVoiceRef.current) {
      utterance.voice = userVoiceRef.current;
    }

    utterance.onend = () => {
      setIsSpeaking(false);
      if (callback) callback();
    };

    utterance.onerror = (e) => {
      console.error("Speech error", e);
      setIsSpeaking(false);
      if (callback) callback();
    };

    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Recognition already started");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleVoiceInput = (transcript: string, fromDemo: boolean = false) => {
    const lower = transcript.toLowerCase();

    // Only add message if not from demo (demo adds it via speak)
    if (!fromDemo) {
      addMessage('user', transcript);
    }

    // Access latest state via refs or functional updates
    const currentIndex = currentFieldIndex; // This is stale in callback if not careful, but we use it from state in render

    // If we are not in a field yet
    if (currentIndex === -1) {
      if (lower.includes('start') || lower.includes('begin')) {
        setCurrentFieldIndex(0);
        setAutoMode(true);
      } else if (lower.includes('download')) {
        speak("Downloading your PDF now.");
        downloadPDF();
      }
      return;
    }

    // We are in a field. Update it in both state and PDF
    setFields(prevFields => {
      const newFields = [...prevFields];
      if (newFields[currentIndex]) {
        newFields[currentIndex].value = transcript;
        // Update PDF in real-time
        updatePDFField(newFields[currentIndex].name, transcript);
      }
      return newFields;
    });

    // Move to next field
    // We use a timeout to allow the UI to update before moving on
    setTimeout(() => {
      if (currentIndex < fieldsRef.current.length - 1) {
        setCurrentFieldIndex(prev => prev + 1);
      } else {
        speak("That was the last field. Say 'Download' to save.", () => {
            setAutoMode(false);
        });
      }
    }, 500);
  };

  // Effect to handle field progression
  // This effect ONLY triggers when currentFieldIndex changes (and autoMode is true)
  // It does NOT depend on 'fields' to avoid the loop.
  useEffect(() => {
    if (currentFieldIndex >= 0 && autoMode) {
      // Use ref to get the field without adding 'fields' to dependency array
      const field = fieldsRef.current[currentFieldIndex];
      if (!field) return;

      const processField = () => {
        speak(`What is your ${field.name}?`, () => {
          if (isDemoModeRef.current) {
            // Simulate user thinking delay before responding
            setTimeout(() => {
              const mockAnswer = mockData[field.name] || "Test Answer";
              setLastTranscript(mockAnswer); // Visual feedback

              // Speak the user's answer with user voice
              speak(mockAnswer, () => {
                // After user finishes speaking, process the input
                handleVoiceInput(mockAnswer, true); // Pass true to indicate from demo
              }, 'user');
            }, 800);
          } else {
            startListening();
          }
        });
      };

      // Small delay to ensure state is settled
      setTimeout(processField, 500);
    }
  }, [currentFieldIndex, autoMode]); // Removed 'fields', 'isDemoMode', 'mockData' (using refs/constants)

  const downloadPDF = async () => {
    if (!pdfBytes || !file) return;

    // PDF is already updated in real-time, just download current bytes
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `filled_${file.name}`;
    link.click();
  };

  return (
    <div className="app-container">
      {!file && (
        <div className="upload-screen">
          <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>GovAI Form Filler</h1>
            <p style={{ color: 'var(--text-muted)' }}>Hands-free, agentic, accessible PDF automation</p>
          </header>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            <PDFUploader onUpload={handleFileUpload} />
            <button
              onClick={loadDemoPDF}
              style={{
                color: 'var(--primary)',
                background: 'transparent',
                textDecoration: 'underline',
                fontSize: '0.9rem'
              }}
            >
              Or load Grain Receipt Demo
            </button>
          </div>
        </div>
      )}

      {file && (
        <div className="two-column-layout">
          {/* Left Column */}
          <div className="left-column">
            {/* Title and Tagline */}
            <header style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <h1 className="text-gradient" style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>GovAI Form Filler</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Hands-free, agentic, accessible PDF automation</p>
            </header>

            {/* Buttons */}
            <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <button
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flex: '1', minWidth: '120px' }}
                onClick={downloadPDF}
              >
                <Download size={18} /> Download
              </button>
              <button
                className="glass"
                style={{ padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1', minWidth: '120px' }}
                onClick={() => {
                  setCurrentFieldIndex(0);
                  setAutoMode(true);
                  setIsDemoMode(false);
                  setMessages([]);
                }}
                title="Restart Manual"
              >
                <RotateCcw size={18} /> Restart
              </button>
              <button
                className="glass"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  flex: '1 1 100%',
                  minWidth: '200px'
                }}
                onClick={runDemo}
              >
                ▶ Run Mock Voice Demo
              </button>
            </div>

            {/* Live Transcript & Voice Controls */}
            <div className="glass" style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(0, 0, 0, 0.2)',
              overflow: 'hidden' // Ensure children don't spill out
            }}>
              {/* Header */}
              <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                background: 'rgba(255, 255, 255, 0.03)'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Live Transcription</h3>
              </div>

              {/* Scrollable Log */}
              <ConversationLog messages={messages} />

              {/* Fixed Voice Controls */}
              <div style={{
                padding: '1.5rem',
                borderTop: '1px solid var(--border)',
                background: 'rgba(0, 0, 0, 0.1)'
              }}>
                <VoiceAgent
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  lastTranscript={lastTranscript}
                  onToggle={() => isListening ? stopListening() : startListening()}
                />
              </div>
            </div>
          </div>

          {/* Right Column - PDF Viewer */}
          <div className="right-column">
            <PDFViewer pdfBytes={pdfBytes} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
