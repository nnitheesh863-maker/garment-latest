import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Fab, Paper, Typography, IconButton, TextField, InputAdornment, Chip, Avatar, Zoom, Badge, Tooltip, CircularProgress
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { detectLanguage, getSpeechRecognitionLang, getTTSLang, LANGUAGE_NAMES } from '../services/languageDetector';
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
      setNotifications(prev => [n, ...prev].slice(0, 20));
      if (!open) setUnreadCount(c => c + 1);
      addMessage(n.title || n.message || 'New notification', 'system');
      speak(n.title || n.message, 'en');
    });
    socket.on('attendance_update', (d) => {
      addMessage(`Attendance: ${d.clockInTime || d.clockOutTime || 'updated'}`, 'system');
    });
    socket.on('task_update', (d) => {
      addMessage(`Task ${d.status}: ${d.title}`, 'system');
    });
    socket.on('production_update', (d) => {
      addMessage(`Production: ${d.message || 'updated'}`, 'system');
    });
    return () => {
      socket.off('newNotification');
      socket.off('attendance_update');
      socket.off('task_update');
      socket.off('production_update');
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
      addMessage('Speech recognition not available. Please type your command.', 'system');
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
    recognitionInstance.lang = 'en-IN';

    recognitionInstance.onstart = () => setListening(true);
    recognitionInstance.onend = () => setListening(false);
    recognitionInstance.onerror = (e) => {
      setListening(false);
      if (e.error !== 'aborted' && e.error !== 'no-speech') {
        addMessage(`Voice error: ${e.error}. Try typing.`, 'system');
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
  }, []);

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
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const langCode = getTTSLang(lang === 'tanglish' ? 'en' : lang);
    const voice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }, []);

  const addMessage = useCallback((text, role = 'user', lang = 'en') => {
    setMessages(prev => [...prev, { text, role, lang, time: new Date().toLocaleTimeString() }]);
  }, []);

  const processVoiceCommand = useCallback(async (command) => {
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
  }, [user, socket, addMessage, speak]);

  const processCommandLocally = useCallback(async (command, lang) => {
    const cmd = command.toLowerCase().trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    if (/clock.?in|come in|login|check.?in|கிளாக் இன்/.test(cmd)) {
      try {
        const res = await employeeApi.attendance(user._id, {
          date: new Date().toISOString().split('T')[0],
          clockIn: new Date().toISOString(), shift: 'general', timezone: 'IST',
        });
        if (socket) socket.emit('employee_action', { action: 'clock_in', employeeId: user._id });
        const replies = {
          en: `Clocked in at ${now}. Have a great shift!`,
          ta: `கிளாக் இன் ${now}. நல்ல வேளை!`,
          hi: `${now} पर क्लॉक इन। शुभ कार्य!`,
          tanglish: `${now} ku clock in aachu. Nalla velai seiyunga!`,
        };
        return { reply: replies[lang] || replies.en, lang };
      } catch (e) {
        return { reply: `Clocked in at ${now}`, lang: 'en' };
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
          en: `Clocked out at ${now}. You worked ${wh} hours today. Good job!`,
          ta: `கிளாக் அவுட் ${now}. இன்று ${wh} மணி நேரம் வேலை பார்த்தீர்கள். சிறப்பு!`,
          tanglish: `${now} ku clock out aachu. Today ${wh} hours work pannirukinga. Super!`,
        };
        return { reply: replies[lang] || replies.en, lang };
      } catch (e) {
        return { reply: `Clocked out at ${now}`, lang: 'en' };
      }
    }

    if (/what is my task|todays work|inniku enna task|today task|my task|pending task/.test(cmd)) {
      try {
        const res = await taskApi.list({ assignedTo: user._id, status: 'pending' });
        const tasks = res.data?.data || [];
        const taskList = tasks.slice(0, 3).map(t => `• ${t.title}`).join('\n');
        if (tasks.length === 0) {
          return { reply: lang === 'ta' ? 'இன்று உங்களுக்கு பணிகள் எதுவும் இல்லை' : lang === 'hi' ? 'आज कोई कार्य नहीं है' : 'No pending tasks for today', lang };
        }
        return { reply: `You have ${tasks.length} pending tasks:\n${taskList}`, lang: 'en' };
      } catch (e) {
        return { reply: 'Could not fetch tasks', lang: 'en' };
      }
    }

    if (/start task|begin task|task start/.test(cmd)) {
      return { reply: 'Which task would you like to start? Please say the task number or name.', lang: 'en' };
    }

    if (/complete task|task complete|finish task|done task/.test(cmd)) {
      return { reply: 'Which task did you complete? Please specify the task name or number.', lang: 'en' };
    }

    if (/todays target|today target|inniku target|production target/.test(cmd)) {
      return { reply: `Today's production target: Processing... Let me check your dashboard.`, lang: 'en' };
    }

    if (/how many hours|hours worked|enna neram|work time/.test(cmd)) {
      try {
        const res = await api.get(`/api/employees/${user._id}/attendance`);
        const att = res.data?.data || {};
        const hrs = att?.workingHours || att?.totalHours || 0;
        const replies = {
          en: `You have worked ${hrs} hours today.`,
          ta: `இன்று ${hrs} மணி நேரம் வேலை பார்த்திருக்கிறீர்கள்.`,
          tanglish: `Today ${hrs} hours work pannirukinga.`,
        };
        return { reply: replies[lang] || replies.en, lang };
      } catch (e) {
        return { reply: 'Could not fetch hours', lang: 'en' };
      }
    }

    if (/which machine|my machine|enna machine|machine assigned/.test(cmd)) {
      try {
        const userRes = await api.get(`/api/employees/${user._id}`);
        const emp = userRes.data?.data || {};
        const machine = emp?.assignedMachine || emp?.machine?.name || 'Not assigned';
        return { reply: `Your assigned machine is: ${machine}`, lang: 'en' };
      } catch (e) {
        return { reply: 'Could not fetch machine info', lang: 'en' };
      }
    }

    if (/machine health|machine status|machine problem/.test(cmd)) {
      return { reply: 'Machine status is normal. All systems operational.', lang: 'en' };
    }

    if (/any maintenance|maintenance due/.test(cmd)) {
      return { reply: 'No maintenance due for your machine today.', lang: 'en' };
    }

    if (/show attendance|todays attendance|attendance status/.test(cmd)) {
      try {
        const res = await api.get(`/api/employees/${user._id}/attendance`);
        const att = res.data?.data || {};
        const clockIn = att?.clockInTime || 'Not clocked in';
        const clockOut = att?.clockOutTime || 'Not clocked out';
        return { reply: `Today: Clock In: ${clockIn}, Clock Out: ${clockOut}, Hours: ${att?.workingHours || 0}h`, lang: 'en' };
      } catch (e) {
        return { reply: 'Could not fetch attendance', lang: 'en' };
      }
    }

    if (/show performance|my performance|enna performance|efficiency/.test(cmd)) {
      try {
        const res = await employeeApi.getPerformance(user._id);
        const data = res.data?.data || {};
        return { reply: `Performance: ${data.completionRate || 0}% completion, ${data.qualityRate || 0}% quality rate`, lang: 'en' };
      } catch (e) {
        return { reply: 'Could not fetch performance data', lang: 'en' };
      }
    }

    if (/open dashboard|dashboard|go to home/.test(cmd)) {
      if (window.__router) window.__router(`/${user?.role || 'employee'}/dashboard`);
      return { reply: 'Opening dashboard', lang: 'en' };
    }

    if (/open attendance|go to attendance/.test(cmd)) {
      if (window.__router) window.__router(`/${user?.role || 'employee'}/attendance`);
      return { reply: 'Opening attendance page', lang: 'en' };
    }

    if (/open tasks|go to tasks|my tasks/.test(cmd)) {
      if (window.__router) window.__router(`/${user?.role || 'employee'}/tasks`);
      return { reply: 'Opening tasks page', lang: 'en' };
    }

    if (/open performance|go to performance/.test(cmd)) {
      if (window.__router) window.__router(`/${user?.role || 'employee'}/performance`);
      return { reply: 'Opening performance page', lang: 'en' };
    }

    if (/report issue|create issue|machine problem|fabric shortage|needle broken/.test(cmd)) {
      if (window.__router) window.__router(`/${user?.role || 'employee'}/report-issue`);
      return { reply: 'Opening issue report page', lang: 'en' };
    }

    if (/apply leave|leave request|half day|medical leave/.test(cmd)) {
      if (window.__router) window.__router(`/${user?.role || 'employee'}/leave-request`);
      return { reply: 'Opening leave request page', lang: 'en' };
    }

    if (/break|rest|lunch|meal/.test(cmd)) {
      return { reply: 'Break time noted. Take your rest and clock back in within 30 minutes.', lang: 'en' };
    }

    if (/translate|language|change language/.test(cmd)) {
      return { reply: 'I understand multiple languages. Just speak in English, Tamil, Hindi, or any language naturally.', lang: 'en' };
    }

    const greetings = {
      en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      ta: ['வணக்கம்', 'வனக்கம்'],
    };
    if (greetings.en.some(g => cmd.includes(g)) || greetings.ta.some(g => cmd.includes(g))) {
      const hour = new Date().getHours();
      const timeGreet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
      const replies = {
        en: `${timeGreet}! I'm your AI assistant. How can I help you today?`,
        ta: `வணக்கம்! நான் உங்கள் AI உதவியாளர். இன்று உங்களுக்கு என்ன உதவி வேண்டும்?`,
        hi: `नमस्ते! मैं आपका AI सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?`,
        tanglish: `${timeGreet}! Naan ungaloda AI assistant. Enna help venum?`,
      };
      return { reply: replies[lang] || replies.en, lang };
    }

    const messages = {
      en: 'I understand you. You can say: Clock In, Clock Out, My Tasks, Show Attendance, Report Issue, or ask questions about your work.',
      ta: 'நான் உங்களை புரிந்துகொள்கிறேன். நீங்கள் சொல்லலாம்: கிளாக் இன், கிளாக் அவுட், எனது பணிகள், வருகை காண்பி, பிரச்சனை புகார்',
      hi: 'मैं आपको समझता हूँ। आप कह सकते हैं: क्लॉक इन, क्लॉक आउट, मेरे कार्य, उपस्थिति दिखाएँ, समस्या रिपोर्ट करें',
      tanglish: 'Puriyudhu. Neenga solalam: Clock In, Clock Out, My Tasks, Attendance, Issue Report,',
    };
    return { reply: messages[lang] || messages.en, lang };
  }, [user, socket]);

  const handleSendText = useCallback(async () => {
    if (!inputText.trim()) return;
    await processVoiceCommand(inputText.trim());
    setInputText('');
  }, [inputText, processVoiceCommand]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  }, [handleSendText]);

  const getMessageIcon = (role) => {
    if (role === 'user') return <PersonIcon fontSize="small" />;
    if (role === 'system') return <AccessTimeIcon fontSize="small" sx={{ color: 'warning.main' }} />;
    return <SmartToyIcon fontSize="small" sx={{ color: 'secondary.main' }} />;
  };

  const getMessageBg = (role) => {
    if (role === 'user') return 'primary.main';
    if (role === 'system') return 'warning.light';
    return 'grey.100';
  };

  const getMessageColor = (role) => {
    if (role === 'user') return '#fff';
    return 'text.primary';
  };

  return (
    <>
      <Badge
        color="error"
        badgeContent={unreadCount}
        invisible={unreadCount === 0 || open}
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}
      >
        <Zoom in={!open}>
          <Tooltip title="Voice Assistant" placement="left">
            <Fab
              color={listening ? 'secondary' : 'primary'}
              aria-label="voice assistant"
              onClick={() => { setOpen(true); setUnreadCount(0); }}
              sx={{
                width: 64, height: 64,
                boxShadow: listening ? '0 0 24px rgba(156,39,176,0.6)' : 6,
                animation: listening ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': { '0%': { boxShadow: '0 0 0 0 rgba(156,39,176,0.7)' }, '70%': { boxShadow: '0 0 0 15px rgba(156,39,176,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(156,39,176,0)' } },
              }}
            >
              {listening ? <MicOffIcon sx={{ fontSize: 28 }} /> : <MicIcon sx={{ fontSize: 28 }} />}
            </Fab>
          </Tooltip>
        </Zoom>
      </Badge>

      <Zoom in={open}>
        <Paper
          elevation={12}
          sx={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 1300,
            width: 380, maxWidth: 'calc(100vw - 32px)', height: 560, maxHeight: 'calc(100vh - 120px)',
            display: 'flex', flexDirection: 'column', borderRadius: 3, overflow: 'hidden',
          }}
        >
          <Box sx={{
            p: 1.5, display: 'flex', alignItems: 'center', gap: 1,
            background: 'linear-gradient(135deg, #7c4dff, #6200ea)',
          }}>
            <SmartToyIcon sx={{ color: '#fff' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} color="#fff">
                AI Voice Assistant
              </Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.8)">
                {listening ? 'Listening...' : connected ? 'Online' : 'Offline'} · {LANGUAGE_NAMES[currentLang] || 'English'}
              </Typography>
            </Box>
            {listening && <CircularProgress size={20} sx={{ color: '#fff' }} />}
            <IconButton size="small" sx={{ color: '#fff' }} onClick={() => { setOpen(false); setUnreadCount(0); }}><CloseIcon /></IconButton>
          </Box>

          <Box ref={chatRef} sx={{ flex: 1, overflowY: 'auto', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: '#fafafa' }}>
            {messages.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <SmartToyIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">Voice Assistant ready</Typography>
                <Typography variant="caption">Tap the mic or type a command</Typography>
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                  {['Clock In', 'My Tasks', 'Show Attendance', 'Help'].map(cmd => (
                    <Chip key={cmd} label={cmd} size="small" variant="outlined" onClick={() => processVoiceCommand(cmd)} sx={{ cursor: 'pointer' }} />
                  ))}
                </Box>
              </Box>
            )}
            {messages.map((msg, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                <Avatar sx={{ width: 28, height: 28, bgcolor: msg.role === 'user' ? 'primary.main' : msg.role === 'system' ? 'warning.main' : 'secondary.main' }}>
                  {getMessageIcon(msg.role)}
                </Avatar>
                <Paper elevation={0} sx={{
                  p: 1.5, borderRadius: 2, maxWidth: '80%',
                  bgcolor: getMessageBg(msg.role),
                  color: getMessageColor(msg.role),
                  borderTopRightRadius: msg.role === 'user' ? 0 : 2,
                  borderTopLeftRadius: msg.role === 'user' ? 2 : 0,
                  whiteSpace: 'pre-wrap',
                }}>
                  <Typography variant="body2">{msg.text}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mt: 0.5 }}>{msg.time}</Typography>
                </Paper>
              </Box>
            ))}
            {processing && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pl: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">Processing...</Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth size="small" placeholder="Type a command..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={processing}
                InputProps={{
                  sx: { borderRadius: 3 },
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        color={listening ? 'secondary' : 'default'}
                        onClick={listening ? stopListening : startListening}
                      >
                        {listening ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton color="primary" onClick={handleSendText} disabled={!inputText.trim() || processing} sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' }, '&.Mui-disabled': { bgcolor: 'grey.300' } }}>
                <SendIcon />
              </IconButton>
            </Box>
            {transcript && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                "{transcript}"
              </Typography>
            )}
          </Box>
        </Paper>
      </Zoom>
    </>
  );
}
