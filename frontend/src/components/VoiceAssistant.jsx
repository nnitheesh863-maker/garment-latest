import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Fab,
  Paper,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Zoom,
  Badge,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import {
  detectLanguage,
  getSpeechRecognitionLang,
  getTTSLang,
  LANGUAGE_NAMES,
} from '../services/languageDetector';
import { employeeApi, taskApi } from '../api/axios';
import api from '../api/axios';

let recognitionInstance = null;

export default function VoiceAssistant() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [transcript, setTranscript] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!socket) return;
    socket.on('newNotification', (n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 20));
      if (!open) setUnreadCount((c) => c + 1);
      addMessage(n.title || n.message || 'New notification', 'system');
      speak(n.title || n.message, 'en');
    });
    socket.on('attendance_update', (d) => {
      addMessage(`Attendance: ${d.clockInTime || d.clockOutTime || 'updated'}`, 'system');
    });
    socket.on('taskUpdated', (d) => {
      addMessage(`Task ${d.task?.status || 'updated'}: ${d.task?.title || ''}`, 'system');
    });
    socket.on('productionUpdated', (d) => {
      addMessage(`Production: ${d.message || 'updated'}`, 'system');
    });
    return () => {
      socket.off('newNotification');
      socket.off('attendance_update');
      socket.off('taskUpdated');
      socket.off('productionUpdated');
    };
  }, [socket, open]);

  useEffect(() => {
    if (listening && transcript) {
      const lang = detectLanguage(transcript);
      setCurrentLang(lang);
    }
  }, [transcript, listening]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addMessage('Speech recognition is not available on this browser. Please type your command.', 'system');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (recognitionInstance) {
      recognitionInstance.abort();
      recognitionInstance = null;
    }
    recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.maxAlternatives = 3;
    recognitionInstance.lang = getSpeechRecognitionLang(currentLang);

    recognitionInstance.onstart = () => setListening(true);
    recognitionInstance.onend = () => setListening(false);
    recognitionInstance.onerror = (e) => {
      setListening(false);
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        addMessage(`Voice error: ${e.error}. You can type commands below.`, 'system');
      }
    };
    recognitionInstance.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t;
        else interimText += t;
      }
      setTranscript(finalText || interimText);
      if (finalText) {
        processVoiceCommand(finalText);
      }
    };
    recognitionInstance.start();
  }, [currentLang]);

  const stopListening = useCallback(() => {
    if (recognitionInstance) {
      recognitionInstance.abort();
      recognitionInstance = null;
    }
    setListening(false);
  }, []);

  const speak = useCallback((text, lang = 'en') => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getTTSLang(lang === 'tanglish' ? 'en' : lang);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const langCode = getTTSLang(lang === 'tanglish' ? 'en' : lang);
    const voice = voices.find((v) => v.lang.startsWith(langCode.split('-')[0]));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const addMessage = useCallback((text, role = 'user', lang = 'en') => {
    setMessages((prev) => [
      ...prev,
      { text, role, lang, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
  }, []);

  const processVoiceCommand = useCallback(
    async (command) => {
      if (!command || !user?._id) return;
      const detectedLang = detectLanguage(command);
      setCurrentLang(detectedLang);
      addMessage(command, 'user', detectedLang);
      setProcessing(true);
      try {
        const res = await api.post('/api/voice/process', {
          command,
          language: detectedLang,
          employeeId: user._id,
        });
        const data = res.data?.data || res.data;
        const reply = data?.reply || data?.message || 'Command processed successfully';
        const replyLang = data?.language || detectedLang;
        addMessage(reply, 'ai', replyLang);
        speak(reply, replyLang);
        if (data?.action && socket) {
          socket.emit('employee_action', {
            action: data.action,
            employeeId: user._id,
            data: data.details || {},
          });
        }
        if (data?.navigate && window.__router) {
          window.__router(data.navigate);
        }
      } catch (err) {
        const fallback = await processCommandLocally(command, detectedLang);
        addMessage(fallback.reply, 'ai', fallback.lang);
        speak(fallback.reply, fallback.lang);
      } finally {
        setProcessing(false);
        setTranscript('');
      }
    },
    [user, socket, addMessage, speak]
  );

  const processCommandLocally = useCallback(
    async (command, lang) => {
      const cmd = command.toLowerCase().trim();
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      if (/clock.?in|come in|login|check.?in|கிளாக் இன்/.test(cmd)) {
        try {
          await employeeApi.attendance(user._id, {
            date: new Date().toISOString().split('T')[0],
            clockIn: new Date().toISOString(),
            shift: 'general',
            timezone: 'IST',
          });
          if (socket) socket.emit('employee_action', { action: 'clock_in', employeeId: user._id });
          const replies = {
            en: `Clocked in at ${now}. Have a great, productive shift!`,
            ta: `கிளாக் இன் ${now}. நல்ல வேளை மற்றும் சிறந்த உற்பத்தி அமையட்டும்!`,
            hi: `${now} पर क्लॉक इन दर्ज हुआ। आपका दिन शुभ हो!`,
            tanglish: `${now} ku clock in aachu. Nalla velai seiyunga!`,
          };
          return { reply: replies[lang] || replies.en, lang };
        } catch {
          return { reply: `Clocked in recorded at ${now}`, lang: 'en' };
        }
      }

      if (/clock.?out|go home|check.?out|logout|கிளாக் அவுட்/.test(cmd)) {
        try {
          const res = await employeeApi.attendance(user._id, {
            date: new Date().toISOString().split('T')[0],
            clockOut: new Date().toISOString(),
          });
          const wh = res.data?.data?.workingHours || 0;
          if (socket) socket.emit('employee_action', { action: 'clock_out', employeeId: user._id });
          const replies = {
            en: `Clocked out at ${now}. You logged ${wh} hours today. Excellent work!`,
            ta: `கிளாக் அவுட் ${now}. இன்று ${wh} மணி நேரம் வேலை பார்த்தீர்கள். சிறப்பு!`,
            tanglish: `${now} ku clock out aachu. Today ${wh} hours work pannirukinga. Super!`,
          };
          return { reply: replies[lang] || replies.en, lang };
        } catch {
          return { reply: `Clocked out at ${now}`, lang: 'en' };
        }
      }

      if (/what is my task|todays work|inniku enna task|today task|my task|pending task/.test(cmd)) {
        try {
          const res = await taskApi.list({ assignedTo: user._id, status: 'pending' });
          const tasks = res.data?.data || [];
          const taskList = tasks.slice(0, 3).map((t) => `• ${t.title}`).join('\n');
          if (tasks.length === 0) {
            return {
              reply:
                lang === 'ta'
                  ? 'இன்று உங்களுக்கு நிலுவையில் உள்ள பணிகள் எதுவும் இல்லை'
                  : lang === 'hi'
                  ? 'आज कोई लंबित कार्य नहीं है'
                  : 'You have no pending tasks right now.',
              lang,
            };
          }
          return { reply: `You have ${tasks.length} pending tasks:\n${taskList}`, lang: 'en' };
        } catch {
          return { reply: 'Could not fetch your tasks right now.', lang: 'en' };
        }
      }

      // Check for logged in / active users query
      if (/which user|who logged in|logged in today|who is online|who is present|active users|logged in/.test(cmd)) {
        try {
          const res = await api.get('/api/users?active=true&limit=10');
          const users = res.data?.data || [];
          if (users.length > 0) {
            const list = users.map((u) => `• ${u.profile?.firstName || u.email} (${u.role.toUpperCase()})`).join('\n');
            return {
              reply: `Active registered users (${users.length}):\n${list}`,
              lang: 'en',
            };
          }
        } catch {
          return { reply: 'Currently inspecting active logged-in users. Please check the Admin User Management portal for live telemetry.', lang: 'en' };
        }
      }

      // Word-boundary matching for greetings so words like 'which', 'machine', 'shift' don't trigger 'hi'
      const greetingRegex = /\b(hello|hi|hey|good\s+morning|good\s+afternoon|good\s+evening|vanakkam|வணக்கம்|नमस्ते)\b/i;
      if (greetingRegex.test(cmd)) {
        const hour = new Date().getHours();
        const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        const replies = {
          en: `${timeGreet}! I'm your Couture AI floor assistant. How can I assist your shift today?`,
          ta: `வணக்கம்! நான் உங்கள் AI உதவியாளர். இன்று உங்களுக்கு என்ன உதவி வேண்டும்?`,
          hi: `नमस्ते! मैं आपका AI सहायक हूँ। आज मैं आपकी कैसे सहायता कर सकता हूँ?`,
          tanglish: `${timeGreet}! Naan ungaloda AI assistant. Enna help venum?`,
        };
        return { reply: replies[lang] || replies.en, lang };
      }

      const defaultMsg = {
        en: 'I understand you. You can say: "Which users logged in today", "Clock In", "Clock Out", "My Tasks", "Machine Health", or "Report Issue".',
        ta: 'நான் உங்களை புரிந்துகொள்கிறேன். நீங்கள் சொல்லலாம்: கிளாக் இன், கிளாக் அவுட், எனது பணிகள், பிரச்சனை புகார்',
        hi: 'मैं आपको समझता हूँ। आप कह सकते हैं: क्लॉक इन, क्लॉक आउट, मेरे कार्य, समस्या रिपोर्ट',
        tanglish: 'Puriyudhu. Neenga solalam: Clock In, Clock Out, My Tasks, Attendance, Issue Report',
      };
      return { reply: defaultMsg[lang] || defaultMsg.en, lang };
    },
    [user, socket]
  );

  const handleSendText = useCallback(async () => {
    if (!inputText.trim()) return;
    await processVoiceCommand(inputText.trim());
    setInputText('');
  }, [inputText, processVoiceCommand]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
      }
    },
    [handleSendText]
  );

  const getMessageIcon = (role) => {
    if (role === 'user') return <PersonIcon fontSize="small" />;
    if (role === 'system') return <AccessTimeIcon fontSize="small" sx={{ color: 'warning.main' }} />;
    return <SmartToyIcon fontSize="small" sx={{ color: '#FED7B8' }} />;
  };

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1300 }}>
        <Badge
          color="error"
          badgeContent={unreadCount}
          invisible={unreadCount === 0 || open}
          sx={{
            '& .MuiBadge-badge': {
              bgcolor: '#59171B',
              color: '#FED7B8',
              fontWeight: 800,
              boxShadow: '0 0 10px rgba(89,23,27,0.6)',
            },
          }}
        >
          <Zoom in={!open}>
            <Tooltip title="Floor AI Voice Assistant (Multilingual)" placement="left" arrow>
              <Box sx={{ position: 'relative', display: 'flex' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    inset: -6,
                    borderRadius: '50%',
                    background:
                      'conic-gradient(from 0deg, #FED7B8, transparent 40%, #7A2328 70%, transparent)',
                    opacity: 0.6,
                    animation: 'orbSpin 8s linear infinite',
                    filter: 'blur(2px)',
                    pointerEvents: 'none',
                  }}
                />
                <Fab
                  aria-label="voice assistant"
                  onClick={() => {
                    setOpen(true);
                    setUnreadCount(0);
                  }}
                  sx={{
                    width: 66,
                    height: 66,
                    background: listening
                      ? 'linear-gradient(135deg, #7A2328, #A45A4A)'
                      : 'linear-gradient(135deg, #59171B, #7A2328)',
                    color: '#FED7B8',
                    boxShadow: listening
                      ? '0 0 32px rgba(89, 23, 27, 0.6), 0 6px 20px rgba(89, 23, 27, 0.4)'
                      : '0 12px 32px rgba(89, 23, 27, 0.38)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #A45A4A, #59171B)',
                      transform: 'scale(1.08) rotate(6deg)',
                    },
                  }}
                >
                  {listening ? (
                    <MicOffIcon sx={{ fontSize: 30 }} />
                  ) : (
                    <MicIcon sx={{ fontSize: 30 }} />
                  )}
                </Fab>
              </Box>
            </Tooltip>
          </Zoom>
        </Badge>
      </Box>

      <Zoom in={open}>
        <Paper
          elevation={16}
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            zIndex: 1300,
            width: 400,
            maxWidth: 'calc(100vw - 32px)',
            height: 580,
            maxHeight: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '24px',
            overflow: 'hidden',
            border: (theme) =>
              `1px solid ${
                theme.palette.mode === 'dark' ? 'rgba(254,215,184,0.15)' : 'rgba(241,213,192,0.9)'
              }`,
            boxShadow: '0 24px 64px rgba(89,23,27,0.22)',
            bgcolor: 'background.paper',
          }}
        >
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              background: 'linear-gradient(135deg, #59171B, #7A2328, #A45A4A)',
              position: 'relative',
            }}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                background: 'rgba(254,215,184,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(254,215,184,0.35)',
              }}
            >
              <SmartToyIcon sx={{ color: '#FED7B8' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={800} color="#FFF8F2" sx={{ fontSize: '0.95rem' }}>
                Floor Voice AI
              </Typography>
              <Typography variant="caption" color="rgba(254,215,184,0.9)" sx={{ fontWeight: 600 }}>
                {listening ? 'Listening to voice...' : connected ? 'Online' : 'Offline'} &bull;{' '}
                {LANGUAGE_NAMES[currentLang] || 'English'}
              </Typography>
            </Box>

            {listening && (
              <Box className="soundwave-container" sx={{ mr: 1 }}>
                <span className="soundwave-bar" style={{ background: '#FED7B8' }} />
                <span className="soundwave-bar" style={{ background: '#FED7B8' }} />
                <span className="soundwave-bar" style={{ background: '#FED7B8' }} />
                <span className="soundwave-bar" style={{ background: '#FED7B8' }} />
              </Box>
            )}

            <IconButton
              size="small"
              sx={{
                color: '#FED7B8',
                borderRadius: '8px',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
              }}
              onClick={() => {
                setOpen(false);
                setUnreadCount(0);
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Box
            ref={chatRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
              bgcolor: (theme) =>
                theme.palette.mode === 'dark' ? '#1A1012' : '#FFF8F2',
            }}
          >
            {messages.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Box className="ai-orb" sx={{ width: 68, height: 68, mx: 'auto', mb: 2 }}>
                  <SmartToyIcon sx={{ fontSize: 32 }} />
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary' }}>
                  Floor Assistant Ready
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  Speak in English, Tamil, Hindi, or any local dialect
                </Typography>
                <Box
                  sx={{
                    mt: 2.5,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.75,
                    justifyContent: 'center',
                  }}
                >
                  {['Clock In', 'My Tasks', 'Machine Health', 'Show Attendance'].map((cmd) => (
                    <Chip
                      key={cmd}
                      label={cmd}
                      size="small"
                      variant="outlined"
                      onClick={() => processVoiceCommand(cmd)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: '8px',
                        borderColor: 'rgba(122, 35, 40, 0.4)',
                        color: 'primary.main',
                        fontWeight: 700,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'rgba(254, 215, 184, 0.45)',
                          borderColor: 'primary.main',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  display: 'flex',
                  gap: 8,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}
              >
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor:
                      msg.role === 'user'
                        ? '#59171B'
                        : msg.role === 'system'
                        ? '#F59E0B'
                        : '#7A2328',
                    color: '#FFF8F2',
                  }}
                >
                  {getMessageIcon(msg.role)}
                </Avatar>
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.6,
                    borderRadius: '16px',
                    maxWidth: '82%',
                    background:
                      msg.role === 'user'
                        ? 'linear-gradient(135deg, #59171B, #7A2328)'
                        : msg.role === 'system'
                        ? 'rgba(245, 158, 11, 0.14)'
                        : (theme) =>
                            theme.palette.mode === 'dark' ? 'rgba(254,215,184,0.1)' : '#FFFFFF',
                    color: msg.role === 'user' ? '#FFF8F2' : 'text.primary',
                    border:
                      msg.role === 'ai'
                        ? '1px solid rgba(241, 213, 192, 0.7)'
                        : 'none',
                    boxShadow:
                      msg.role === 'ai' ? '0 4px 16px rgba(89,23,27,0.06)' : 'none',
                    borderTopRightRadius: msg.role === 'user' ? 0 : '16px',
                    borderTopLeftRadius: msg.role === 'user' ? '16px' : 0,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'inherit', fontSize: '0.88rem', lineHeight: 1.5 }}>
                    {msg.text}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mt={0.5} gap={1}>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.7,
                        fontSize: '0.72rem',
                        color: msg.role === 'user' ? '#FED7B8' : 'text.secondary',
                      }}
                    >
                      {msg.time}
                    </Typography>
                    {msg.role === 'ai' && (
                      <IconButton
                        size="small"
                        onClick={() => speak(msg.text, msg.lang)}
                        sx={{ p: 0.2, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                      >
                        <VolumeUpIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    )}
                  </Box>
                </Paper>
              </motion.div>
            ))}

            {processing && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pl: 1 }}>
                <Box className="loading-dots" sx={{ display: 'inline-flex' }}>
                  <span />
                  <span />
                  <span />
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Speak or type a command..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={processing}
                InputProps={{
                  sx: { borderRadius: '12px' },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        color={listening ? 'secondary' : 'default'}
                        onClick={listening ? stopListening : startListening}
                        sx={{
                          color: listening ? '#DC2626' : 'inherit',
                          animation: listening ? 'pulseLiveDot 1.5s infinite' : 'none',
                        }}
                      >
                        {listening ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSendText}
                disabled={!inputText.trim() || processing}
                sx={{
                  background: 'linear-gradient(135deg, #59171B, #7A2328)',
                  color: '#FFF8F2',
                  borderRadius: '12px',
                  p: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7A2328, #A45A4A)',
                    transform: 'scale(1.05)',
                  },
                  '&.Mui-disabled': { bgcolor: 'rgba(241,213,192,0.3)', color: '#B39A8C' },
                }}
              >
                <SendIcon fontSize="small" />
              </IconButton>
            </Box>
            {transcript && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', fontSize: '0.75rem' }}
              >
                "{transcript}"
              </Typography>
            )}
          </Box>
        </Paper>
      </Zoom>
    </>
  );
}
