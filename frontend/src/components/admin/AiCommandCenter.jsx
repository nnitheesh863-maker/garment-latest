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
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';

export default function AiCommandCenter({ onOrderCreated }) {
  const [command, setCommand] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [context, setContext] = useState({});
  const [promptMsg, setPromptMsg] = useState('Ask me to create an order or check factory performance.');
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

  const normalizeDateFrontend = (str) => {
    if (!str) return '';
    const cleaned = String(str).trim();
    if (/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
      const [d, m, y] = cleaned.split('-');
      return `${y}-${m}-${d}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      const [d, m, y] = cleaned.split('/');
      return `${y}-${m}-${d}`;
    }
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(cleaned)) {
      const [d, m, y] = cleaned.split('.');
      return `${y}-${m}-${d}`;
    }
    return cleaned;
  };

  const handleEditChange = (field, value) => {
    setEditParams(prev => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  const handleSaveEdit = async () => {
    const errors = [];
    if (!editParams.customerName || !editParams.customerName.trim()) {
      errors.push('Customer Name is required.');
    }
    if (!editParams.garmentType || !editParams.garmentType.trim()) {
      errors.push('Garment Type is required.');
    }
    const qty = parseInt(editParams.quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.push('Quantity must be greater than 0.');
    }
    if (!editParams.size || !editParams.size.trim()) {
      errors.push('Size is required.');
    }
    if (!editParams.startDate) {
      errors.push('Start Date is required.');
    }
    if (!editParams.deadline) {
      errors.push('Delivery Deadline is required.');
    }
    if (editParams.startDate && editParams.deadline) {
      const start = new Date(editParams.startDate);
      const end = new Date(editParams.deadline);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        errors.push('Delivery Deadline must be after Start Date.');
      }
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/ai/command', {
        command: 're-analyze parameters',
        context: {
          intent: 'CREATE_ORDER',
          parameters: editParams,
        },
        confirm: false,
      });

      const resData = response.data?.data || response.data;
      if (resData.status === 'ready_to_confirm') {
        setPromptMsg(resData.prompt || 'Ready to confirm.');
        setContext(resData.context);
        setIsEditing(false);
        setValidationErrors([]);
      } else if (resData.status === 'validation_error') {
        setValidationErrors(resData.errors || []);
      }
    } catch (err) {
      console.error('Save Edit Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
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

      rec.onerror = () => {
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

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
    
    // Add user message to conversation list
    setConversation(prev => [...prev, { sender: 'user', text: userMsg }]);

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
        setConversation(prev => [...prev, { sender: 'ai', text: resData.prompt }]);
      } else if (resData.status === 'ready_to_confirm') {
        setPromptMsg(resData.prompt);
        setMissingField(null);
        setContext(resData.context);
        setShowConfirmation(true);
        setIsEditing(false);
        setValidationErrors([]);
        setConversation(prev => [...prev, { sender: 'ai', text: resData.prompt }]);
      } else if (resData.status === 'validation_error') {
        setPromptMsg('Please correct the validation errors in the preview form.');
        setContext(resData.context);
        setValidationErrors(resData.errors || []);
        setShowConfirmation(true);
        setIsEditing(true);
        setEditParams(resData.context?.parameters || {});
      } else if (resData.status === 'info') {
        setPromptMsg(resData.prompt);
        setConversation(prev => [...prev, { sender: 'ai', text: resData.prompt }]);
        setContext({});
      } else {
        setPromptMsg(resData.prompt || 'I could not process that request.');
        setConversation(prev => [...prev, { sender: 'ai', text: resData.prompt || 'Please try again.' }]);
        setContext({});
      }
    } catch (err) {
      console.error('AI Command Error:', err);
      setPromptMsg('AI Service temporarily unavailable. You can continue manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/ai/command', {
        command: 'confirm order creation',
        context,
        confirm: true,
      });

      const resData = response.data?.data || response.data;
      if (resData.status === 'success') {
        setCreatedOrderInfo(resData);
        setShowConfirmation(false);
        setIsEditing(false);
        setContext({});
        setPromptMsg('Order created successfully!');
        setConversation(prev => [...prev, { sender: 'ai', text: `✓ Order ${resData.order?.orderNumber} created successfully.` }]);
        if (onOrderCreated) onOrderCreated(resData.order);
      }
    } catch (err) {
      console.error('Confirm Order Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setContext({});
    setShowConfirmation(false);
    setIsEditing(false);
    setValidationErrors([]);
    setCreatedOrderInfo(null);
    setConversation([]);
    setPromptMsg('Command cancelled. Ask me to create an order or check factory performance.');
  };

  return (
    <Box mb={3.5}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(254,247,240,0.85) 100%)',
          border: '1px solid rgba(89, 23, 27, 0.08)',
          boxShadow: '0 10px 30px -10px rgba(89, 23, 27, 0.06), 0 2px 6px -2px rgba(89, 23, 27, 0.04)',
          backdropFilter: 'blur(24px)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 16px 36px -12px rgba(89, 23, 27, 0.1), 0 4px 12px -2px rgba(89, 23, 27, 0.06)',
          }
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #59171B, #A45A4A)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(89, 23, 27, 0.25)',
              }}
            >
              <AutoAwesomeIcon sx={{ fontSize: 19, color: '#FED7B8' }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#59171B', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Couture AI Orchestrator
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Natural Language Factory Command & Order Automation
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label="Groq LLaMA 3.3 Active"
              size="small"
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 700,
                bgcolor: 'rgba(89, 23, 27, 0.06)',
                color: '#59171B',
                border: '1px solid rgba(89, 23, 27, 0.1)',
              }}
            />
          </Box>
        </Box>

        {/* Conversation flow logs */}
        <Box
          sx={{
            maxHeight: 180,
            overflowY: 'auto',
            mb: 2,
            px: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {conversation.map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                bgcolor: msg.sender === 'user' ? '#59171B' : 'rgba(89, 23, 27, 0.08)',
                color: msg.sender === 'user' ? '#FED7B8' : 'text.primary',
                p: 1.25,
                px: 2,
                borderRadius: 2,
                maxWidth: '80%',
              }}
            >
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {msg.text}
              </Typography>
            </Box>
          ))}
          <div ref={conversationEndRef} />
        </Box>

        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}>
          {promptMsg}
        </Typography>

        {/* Input Bar */}
        <AnimatePresence>
          {!showConfirmation && !createdOrderInfo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Box display="flex" gap={1.5} alignItems="center">
                <TextField
                  fullWidth
                  variant="outlined"
                  size="medium"
                  placeholder={
                    missingField 
                      ? `Type missing info: ${missingField.replace(/([A-Z])/g, ' $1')}...` 
                      : 'e.g. "Create order for Zenith Wear, 5000 silk blouses, delivery on Oct 30."'
                  }
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendCommand()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      bgcolor: '#FFFFFF',
                      boxShadow: '0 2px 10px rgba(89, 23, 27, 0.04)',
                      '& fieldset': { borderColor: 'rgba(89, 23, 27, 0.12)' },
                      '&:hover fieldset': { borderColor: '#59171B' },
                      '&.Mui-focused fieldset': { borderColor: '#59171B', borderWidth: '1.5px' },
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={toggleListening} color={listening ? 'error' : 'default'} sx={{ mr: 0.5 }}>
                        {listening ? <MicOffIcon sx={{ color: '#DC2626' }} /> : <MicIcon sx={{ color: '#59171B' }} />}
                      </IconButton>
                    )
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSendCommand}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #59171B 0%, #7A2328 100%)',
                    color: '#FED7B8',
                    px: 3.5,
                    height: 52,
                    borderRadius: 3,
                    boxShadow: '0 6px 18px rgba(89, 23, 27, 0.28)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7A2328 0%, #A45A4A 100%)',
                      boxShadow: '0 8px 24px rgba(89, 23, 27, 0.35)',
                    }
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                </Button>
              </Box>

              {/* Quick AI Suggestions */}
              <Box display="flex" flexWrap="wrap" gap={1} mt={1.5} alignItems="center">
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 0.5 }}>
                  Quick commands:
                </Typography>
                {[
                  'Create order for Vogue Line, 3000 cotton shirts',
                  'Check machine maintenance schedule',
                  'Show low stock inventory alerts',
                ].map((promptText, idx) => (
                  <Chip
                    key={idx}
                    label={promptText}
                    size="small"
                    onClick={() => {
                      setCommand(promptText);
                    }}
                    sx={{
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                      bgcolor: 'rgba(254, 215, 184, 0.25)',
                      color: '#59171B',
                      border: '1px solid rgba(89, 23, 27, 0.08)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(89, 23, 27, 0.08)',
                        borderColor: '#59171B',
                        transform: 'translateY(-1px)',
                      }
                    }}
                  />
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation State */}
        <Collapse in={showConfirmation}>
          <Box
            sx={{
              mt: 2,
              p: 2.5,
              borderRadius: 2.5,
              bgcolor: 'background.paper',
              border: '1px dashed rgba(89, 23, 27, 0.2)',
            }}
          >
            <Typography variant="subtitle2" fontWeight={800} color="#59171B" mb={1.5}>
              ORDER PREVIEW DETAILS
            </Typography>

            {isEditing ? (
              <Box mb={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Customer Name"
                      size="small"
                      value={editParams.customerName || ''}
                      onChange={(e) => handleEditChange('customerName', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Garment Type"
                      size="small"
                      value={editParams.garmentType || ''}
                      onChange={(e) => handleEditChange('garmentType', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      size="small"
                      value={editParams.quantity || ''}
                      onChange={(e) => handleEditChange('quantity', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Garment Size"
                      size="small"
                      value={editParams.size || ''}
                      onChange={(e) => handleEditChange('size', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={editParams.startDate || ''}
                      onChange={(e) => handleEditChange('startDate', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Delivery Deadline"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={editParams.deadline || ''}
                      onChange={(e) => handleEditChange('deadline', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Order Priority"
                      size="small"
                      value={editParams.priority || 'medium'}
                      onChange={(e) => handleEditChange('priority', e.target.value)}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>
                {validationErrors.length > 0 && (
                  <Box mt={2} sx={{ p: 1.5, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fee2e2' }}>
                    {validationErrors.map((err, i) => (
                      <Typography key={i} variant="caption" color="error" display="block">
                        • {err}
                      </Typography>
                    ))}
                  </Box>
                )}
                <Box display="flex" gap={1.5} mt={2.5}>
                  <Button
                    variant="contained"
                    onClick={handleSaveEdit}
                    disabled={loading}
                    sx={{ bgcolor: '#59171B', color: '#FED7B8', '&:hover': { bgcolor: '#7A2328' } }}
                  >
                    Save & Analyze
                  </Button>
                  <Button variant="outlined" onClick={() => setIsEditing(false)}>
                    Cancel Edit
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Grid container spacing={2} mb={2}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                    <Typography variant="body2" fontWeight={700}>{context.parameters?.customerName}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Garment Type</Typography>
                    <Typography variant="body2" fontWeight={700}>{context.parameters?.garmentType}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Quantity</Typography>
                    <Typography variant="body2" fontWeight={700}>{context.parameters?.quantity} units</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Garment Size</Typography>
                    <Typography variant="body2" fontWeight={700}>{context.parameters?.size}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Start Date</Typography>
                    <Typography variant="body2" fontWeight={700}>{context.parameters?.startDate}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Delivery Deadline</Typography>
                    <Typography variant="body2" fontWeight={700}>{context.parameters?.deadline}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">Order Priority</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                      {context.parameters?.priority}
                    </Typography>
                  </Grid>
                </Grid>

                {context.aiPlan && (
                  <Box
                    sx={{
                      mt: 2,
                      mb: 2.5,
                      p: 2,
                      borderRadius: 2.5,
                      bgcolor: context.aiPlan.delayProbability > 30 ? 'rgba(220, 38, 38, 0.05)' : 'rgba(22, 163, 74, 0.05)',
                      border: context.aiPlan.delayProbability > 30 ? '1px solid rgba(220, 38, 38, 0.15)' : '1px solid rgba(22, 163, 74, 0.15)',
                    }}
                  >
                    {context.aiPlan.delayProbability > 30 ? (
                      <Box>
                        <Typography variant="body2" color="error.main" fontWeight={700} display="flex" alignItems="center" gap={1}>
                          ⚠ AI WARNING: High delay risk ({context.aiPlan.delayProbability}% probability).
                        </Typography>
                        <Typography variant="caption" color="error.main" display="block" mt={0.5} sx={{ fontWeight: 600 }}>
                          AI Optimization Tips:
                          <br />• Re-allocate to Line 3 (or Line 1 if available)
                          <br />• Add 2 additional employees to this production batch
                          <br />• Allocate high-speed Machine CT-2000 / IS-5000
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="success.main" fontWeight={700}>
                        ✦ AI CAPACITY ASSESSMENT: Low risk ({context.aiPlan.delayProbability || 0}% delay probability).
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      Recommended Line: Line {context.aiPlan.recommendedLine || 3} · Estimated Duration: {context.aiPlan.recommendedEmployeesCount ? Math.ceil(context.parameters?.quantity / (context.aiPlan.recommendedEmployeesCount * 600)) : 5} days · Completion: {context.aiPlan.expectedCompletion ? new Date(context.aiPlan.expectedCompletion).toLocaleDateString() : 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1.5, fontSize: 13, border: '1px solid rgba(0,0,0,0.04)' }}>
                      <strong>Reasoning:</strong> {context.aiPlan.reasoning}
                    </Typography>
                  </Box>
                )}

                <Box display="flex" gap={1.5} flexWrap="wrap">
                  <Button
                    variant="contained"
                    onClick={handleConfirmOrder}
                    disabled={loading || validationErrors.length > 0}
                    sx={{
                      bgcolor: '#16A34A',
                      color: '#fff',
                      borderRadius: 2,
                      px: 3,
                      '&:hover': { bgcolor: '#15803d' }
                    }}
                  >
                    Approve & Create Order
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      const params = { ...context.parameters } || {};
                      if (params.startDate) params.startDate = normalizeDateFrontend(params.startDate);
                      if (params.deadline) params.deadline = normalizeDateFrontend(params.deadline);
                      setEditParams(params);
                      setValidationErrors([]);
                      setIsEditing(true);
                    }}
                    sx={{
                      bgcolor: '#59171B',
                      color: '#FED7B8',
                      borderRadius: 2,
                      px: 3,
                      '&:hover': { bgcolor: '#7A2328' }
                    }}
                  >
                    Edit Order
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    sx={{
                      borderColor: 'rgba(89, 23, 27, 0.3)',
                      color: '#59171B',
                      borderRadius: 2,
                      '&:hover': { borderColor: '#59171B', bgcolor: 'rgba(89, 23, 27, 0.04)' }
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </Collapse>

        {/* Success & AI Plan details */}
        <Collapse in={!!createdOrderInfo}>
          {createdOrderInfo && (
            <Box
              sx={{
                mt: 2,
                p: 2.5,
                borderRadius: 2.5,
                bgcolor: 'rgba(22, 163, 74, 0.05)',
                border: '1px solid rgba(22, 163, 74, 0.15)',
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircleOutlineIcon sx={{ color: '#16A34A' }} />
                  <Typography variant="subtitle2" fontWeight={800} color="#16A34A">
                    ✓ Order Created: {createdOrderInfo.order?.orderNumber}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={handleCancel}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 700 }}>
                ✦ AI PRODUCTION SCHEDULING REPORT
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">Recommended Line</Typography>
                  <Typography variant="body2" fontWeight={700}>{createdOrderInfo.aiPlan?.recommendedLine}</Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">Reserved Machines</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {createdOrderInfo.aiPlan?.recommendedMachines?.join(', ')}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">Staff Required</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {createdOrderInfo.aiPlan?.recommendedEmployeesCount} operators
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">Expected Completion</Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {new Date(createdOrderInfo.aiPlan?.expectedCompletion).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">Delay Risk / Probability</Typography>
                  <Typography variant="body2" fontWeight={700} color={createdOrderInfo.aiPlan?.delayProbability > 20 ? 'error' : 'success'}>
                    {createdOrderInfo.aiPlan?.delayProbability}%
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Typography variant="caption" color="text.secondary">AI Confidence</Typography>
                  <Typography variant="body2" fontWeight={700} color="primary">
                    {createdOrderInfo.aiPlan?.confidence}%
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="body2" sx={{ mt: 2, p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid rgba(89,23,27,0.06)' }}>
                <strong>AI Reasoning:</strong> {createdOrderInfo.aiPlan?.reasoning}
              </Typography>
            </Box>
          )}
        </Collapse>
      </Paper>
    </Box>
  );
}
