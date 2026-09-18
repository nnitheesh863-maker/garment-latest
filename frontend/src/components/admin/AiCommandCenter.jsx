import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Collapse,
  Chip,
  Grid,
  MenuItem,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import BuildIcon from '@mui/icons-material/Build';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';

export default function AiCommandCenter({ onOrderCreated }) {
  const [activeTab, setActiveTab] = useState(0); // 0 = Direct Simple Admin Console, 1 = AI Assistant Mode

  // --- DIRECT SIMPLE ADMIN ORDER FORM STATE ---
  const [directOrder, setDirectOrder] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    garmentType: 'Linen Dress',
    quantity: 100,
    size: 'M',
    color: 'Champagne Pearl',
    priority: 'normal',
    startDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });
  const [directLoading, setDirectLoading] = useState(false);
  const [directSuccess, setDirectSuccess] = useState(null);
  const [directError, setDirectError] = useState(null);

  // --- AI VOICE / TEXT COMMAND STATE ---
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [context, setContext] = useState({});
  const [promptMsg, setPromptMsg] = useState('Ask me to create an order or check factory telemetry.');
  const [missingField, setMissingField] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdOrderInfo, setCreatedOrderInfo] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editParams, setEditParams] = useState({});
  const [validationErrors, setValidationErrors] = useState([]);

  const conversationEndRef = useRef(null);

  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Handle Direct Order Submit (Zero AI hurdle, instant direct creation)
  const handleDirectOrderSubmit = async (e) => {
    e.preventDefault();
    setDirectLoading(true);
    setDirectError(null);
    setDirectSuccess(null);

    try {
      const payload = {
        customer: {
          name: directOrder.customerName,
          email: directOrder.customerEmail || `${directOrder.customerName.toLowerCase().replace(/\s+/g, '')}@client.com`,
          phone: directOrder.customerPhone || '+1 555-0199',
        },
        orderDetails: {
          garmentType: directOrder.garmentType,
          quantity: Number(directOrder.quantity),
          color: directOrder.color,
          sizes: [{ size: directOrder.size, quantity: Number(directOrder.quantity) }],
        },
        timeline: {
          startDate: directOrder.startDate,
          deliveryDate: directOrder.deliveryDate,
        },
        priority: directOrder.priority,
        status: 'pending',
      };

      const res = await api.post('/api/orders', payload);
      const created = res.data?.data || res.data;

      setDirectSuccess(`Order #${created?.orderNumber || 'GOS'} created successfully!`);
      if (onOrderCreated) onOrderCreated(created);

      // Reset form
      setDirectOrder((prev) => ({
        ...prev,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        quantity: 100,
      }));
    } catch (err) {
      console.error('Direct order creation failed:', err);
      setDirectError(err.response?.data?.message || 'Failed to create order. Please check the fields.');
    } finally {
      setDirectLoading(false);
    }
  };

  // --- AI VOICE SETUP ---
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setCommand(text);
        setListening(false);
      };

      rec.onerror = () => setListening(false);
      rec.onend = () => setListening(false);

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your command.');
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
    } else {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSendCommand = async () => {
    if (!command.trim()) return;
    setLoading(true);
    const userMsg = command;
    setCommand('');
    setConversation((prev) => [...prev, { sender: 'user', text: userMsg }]);

    try {
      const response = await api.post('/api/ai/command', {
        command: userMsg,
        context,
        confirm: false,
      });

      const resData = response.data?.data || response.data;
      if (resData.status === 'missing_info') {
        setPromptMsg(resData.prompt);
        setMissingField(resData.missingField);
        setContext(resData.context);
        setConversation((prev) => [...prev, { sender: 'ai', text: resData.prompt }]);
      } else if (resData.status === 'ready_to_confirm') {
        setPromptMsg(resData.prompt);
        setMissingField(null);
        setContext(resData.context);
        setShowConfirmation(true);
        setIsEditing(false);
        setValidationErrors([]);
        setConversation((prev) => [...prev, { sender: 'ai', text: resData.prompt }]);
      } else {
        setPromptMsg(resData.prompt || 'Request processed.');
        setConversation((prev) => [...prev, { sender: 'ai', text: resData.prompt || 'Done.' }]);
        setContext({});
      }
    } catch (err) {
      console.error('AI Command Error:', err);
      setPromptMsg('Direct Admin Mode active. You can create orders directly using the Direct Console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3.5,
        borderRadius: '16px',
        bgcolor: '#FFFFFF',
        border: '1px solid #E8E2DC',
        boxShadow: '0 8px 30px rgba(89,23,27,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Top Header & Tab Toggle */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: '1px solid #E8E2DC',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          bgcolor: '#FBF8F5',
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: '#59171B',
              color: '#FED7B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {activeTab === 0 ? <FlashOnIcon fontSize="small" /> : <AutoAwesomeIcon fontSize="small" />}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="#231F20">
              Admin Operations Center
            </Typography>
            <Typography variant="caption" color="#6E6966">
              {activeTab === 0
                ? 'Direct Simple Control — Fast manual execution without AI barriers'
                : 'AI Copilot — Natural language & voice operations'}
            </Typography>
          </Box>
        </Box>

        {/* Tab Controls */}
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            minHeight: 36,
            bgcolor: '#FFFFFF',
            borderRadius: '10px',
            p: 0.5,
            border: '1px solid #E8E2DC',
            '& .MuiTab-root': {
              minHeight: 32,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '8px',
              px: 2,
            },
            '& .Mui-selected': {
              bgcolor: '#59171B',
              color: '#FED7B8 !important',
            },
            '& .MuiTabs-indicator': { display: 'none' },
          }}
        >
          <Tab icon={<FlashOnIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="Direct Admin Mode" />
          <Tab icon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="AI Copilot" />
        </Tabs>
      </Box>

      {/* TAB 0: DIRECT SIMPLE ADMIN CONTROL (Instant, Manual, Reliable) */}
      {activeTab === 0 && (
        <Box sx={{ p: 3 }}>
          {directSuccess && (
            <Alert
              severity="success"
              onClose={() => setDirectSuccess(null)}
              sx={{ mb: 2.5, borderRadius: '10px' }}
            >
              {directSuccess}
            </Alert>
          )}
          {directError && (
            <Alert
              severity="error"
              onClose={() => setDirectError(null)}
              sx={{ mb: 2.5, borderRadius: '10px' }}
            >
              {directError}
            </Alert>
          )}

          <Typography variant="subtitle2" fontWeight={800} color="#231F20" mb={1.5}>
            ⚡ Direct Fast Order Dispatcher
          </Typography>

          <Box component="form" onSubmit={handleDirectOrderSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer / Client Name"
                  required
                  value={directOrder.customerName}
                  onChange={(e) => setDirectOrder({ ...directOrder, customerName: e.target.value })}
                  placeholder="e.g. Zara Atelier, H&M Global"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Garment Silhouette"
                  value={directOrder.garmentType}
                  onChange={(e) => setDirectOrder({ ...directOrder, garmentType: e.target.value })}
                >
                  <MenuItem value="Linen Dress">Linen Wrap Slip Dress</MenuItem>
                  <MenuItem value="Tailored Blazer">Tailored Atelier Blazer</MenuItem>
                  <MenuItem value="Silk Blouse">Silk Button-Down Blouse</MenuItem>
                  <MenuItem value="Cashmere Trench">Cashmere Trench Robe</MenuItem>
                  <MenuItem value="Poplin Shirt">Relaxed Poplin Shirt</MenuItem>
                  <MenuItem value="Cotton Trouser">Pleated Cotton Trouser</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Units Quantity"
                  type="number"
                  required
                  value={directOrder.quantity}
                  onChange={(e) => setDirectOrder({ ...directOrder, quantity: e.target.value })}
                />
              </Grid>

              <Grid item xs={6} sm={3} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Primary Size"
                  value={directOrder.size}
                  onChange={(e) => setDirectOrder({ ...directOrder, size: e.target.value })}
                >
                  <MenuItem value="XS">XS</MenuItem>
                  <MenuItem value="S">S</MenuItem>
                  <MenuItem value="M">M</MenuItem>
                  <MenuItem value="L">L</MenuItem>
                  <MenuItem value="XL">XL</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Priority Level"
                  value={directOrder.priority}
                  onChange={(e) => setDirectOrder({ ...directOrder, priority: e.target.value })}
                >
                  <MenuItem value="low">Low Priority</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High Priority</MenuItem>
                  <MenuItem value="urgent">Urgent Rush</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Production Start Date"
                  type="date"
                  value={directOrder.startDate}
                  onChange={(e) => setDirectOrder({ ...directOrder, startDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Delivery Deadline"
                  type="date"
                  value={directOrder.deliveryDate}
                  onChange={(e) => setDirectOrder({ ...directOrder, deliveryDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Colorway / Fabric Swatch"
                  value={directOrder.color}
                  onChange={(e) => setDirectOrder({ ...directOrder, color: e.target.value })}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3} display="flex" alignItems="center">
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={directLoading || !directOrder.customerName}
                  startIcon={directLoading ? <CircularProgress size={16} color="inherit" /> : <AddShoppingCartIcon />}
                  sx={{
                    bgcolor: '#59171B',
                    color: '#FED7B8',
                    py: 1,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    borderRadius: '8px',
                    '&:hover': { bgcolor: '#7A2328' },
                  }}
                >
                  {directLoading ? 'Creating...' : '⚡ DISPATCH DIRECT ORDER'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      )}

      {/* TAB 1: AI ASSISTANT & VOICE MODE (Natural Language) */}
      {activeTab === 1 && (
        <Box sx={{ p: 3 }}>
          <Box display="flex" gap={1.5} alignItems="center" mb={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Create an urgent order of 300 Silk Dresses for Nordstrom by next Friday..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
              disabled={loading}
              sx={{ bgcolor: '#FBF8F5', borderRadius: '8px' }}
            />
            <IconButton
              onClick={toggleListening}
              sx={{
                bgcolor: listening ? '#DC2626' : '#59171B',
                color: '#FFFFFF',
                '&:hover': { bgcolor: listening ? '#B91C1C' : '#7A2328' },
              }}
            >
              {listening ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
            </IconButton>
            <Button
              variant="contained"
              onClick={handleSendCommand}
              disabled={loading || !command.trim()}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              sx={{
                bgcolor: '#59171B',
                color: '#FED7B8',
                px: 2.5,
                fontWeight: 700,
                borderRadius: '8px',
                '&:hover': { bgcolor: '#7A2328' },
              }}
            >
              Send
            </Button>
          </Box>

          {/* Conversation history */}
          {conversation.length > 0 && (
            <Box
              sx={{
                maxHeight: 200,
                overflowY: 'auto',
                p: 1.5,
                bgcolor: '#FBF8F5',
                borderRadius: '8px',
                border: '1px solid #E8E2DC',
              }}
            >
              {conversation.map((msg, i) => (
                <Box
                  key={i}
                  sx={{
                    mb: 1,
                    textAlign: msg.sender === 'user' ? 'right' : 'left',
                  }}
                >
                  <Chip
                    label={msg.text}
                    sx={{
                      bgcolor: msg.sender === 'user' ? '#59171B' : '#FFFFFF',
                      color: msg.sender === 'user' ? '#FED7B8' : '#231F20',
                      border: msg.sender === 'ai' ? '1px solid #E8E2DC' : 'none',
                      fontWeight: 600,
                      maxWidth: '85%',
                      whiteSpace: 'normal',
                      height: 'auto',
                      py: 0.8,
                      px: 1,
                    }}
                  />
                </Box>
              ))}
              <div ref={conversationEndRef} />
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}
