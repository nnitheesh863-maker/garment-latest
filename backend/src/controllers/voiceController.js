const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const Machine = require('../models/Machine');
const { emitToUser, emitToRoom, emitToAll } = require('../services/socketService');

const LANG_MAP = {
  en: 'en', ta: 'ta', hi: 'hi', kn: 'kn', ml: 'ml', te: 'te', tanglish: 'tanglish',
};

function getReply(lang, replies) {
  return replies[lang] || replies.en || 'Command processed';
}

exports.processVoiceCommand = async (req, res) => {
  try {
    const { command, language } = req.body;
    const employeeId = req.user._id;
    const lang = LANG_MAP[language] || 'en';
    const cmd = (command || '').toLowerCase().trim();
    const now = new Date();

    if (!command) {
      return res.json({ success: true, data: { reply: 'How can I help you?', language: 'en' } });
    }

    if (/clock.?in|come in|check.?in|login/.test(cmd)) {
      const dateStr = now.toISOString().split('T')[0];
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);

      let attendance = await Attendance.findOne({ employee: employeeId, date });
      if (!attendance) {
        attendance = await Attendance.create({
          employee: employeeId, date, clockIn: now, shift: 'general',
          timezone: 'IST', status: 'working',
        });
      } else if (!attendance.clockIn) {
        attendance.clockIn = now;
        attendance.status = 'working';
        await attendance.save();
      }

      emitToUser(employeeId, 'attendance_update', { clockInTime: now.toLocaleTimeString(), status: 'working' });
      emitToRoom('management', 'employee_activity', {
        employeeId, action: 'clock_in', time: now, employeeName: req.user.profile?.firstName || 'Employee',
      });

      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Clocked in at ${now.toLocaleTimeString()}. Have a great shift!`,
            ta: `கிளாக் இன் ${now.toLocaleTimeString()}. நல்ல வேலை நாளாக அமைய!`,
            hi: `${now.toLocaleTimeString()} पर क्लॉक इन। शुभ कार्य दिवस!`,
            tanglish: `${now.toLocaleTimeString()} ku clock in aachu. Nalla velai seiyunga!`,
          }),
          language: lang, action: 'clock_in',
        },
      });
    }

    if (/clock.?out|check.?out|go home|logout/.test(cmd)) {
      const dateStr = now.toISOString().split('T')[0];
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);

      let attendance = await Attendance.findOne({ employee: employeeId, date });
      if (attendance && attendance.clockIn && !attendance.clockOut) {
        attendance.clockOut = now;
        const ms = now - attendance.clockIn;
        const hrs = Math.max(0, ms / (1000 * 60 * 60));
        const breakTime = Math.min(hrs * 0.1, 1);
        attendance.workingHours = Math.round((hrs - breakTime) * 100) / 100;
        attendance.breakTime = Math.round(breakTime * 100) / 100;
        attendance.overtime = Math.round(Math.max(0, attendance.workingHours - 8) * 100) / 100;
        await attendance.save();
      }

      emitToUser(employeeId, 'attendance_update', { clockOutTime: now.toLocaleTimeString(), status: 'completed' });
      emitToRoom('management', 'employee_activity', {
        employeeId, action: 'clock_out', time: now, hours: attendance?.workingHours || 0,
        employeeName: req.user.profile?.firstName || 'Employee',
      });

      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Clocked out at ${now.toLocaleTimeString()}. You worked ${attendance?.workingHours || 0} hours.`,
            ta: `கிளாக் அவுட் ${now.toLocaleTimeString()}. நீங்கள் ${attendance?.workingHours || 0} மணி நேரம் வேலை பார்த்தீர்கள்.`,
            tanglish: `${now.toLocaleTimeString()} ku clock out. Today ${attendance?.workingHours || 0} hours work pannirukinga.`,
          }),
          language: lang, action: 'clock_out', details: { workingHours: attendance?.workingHours || 0 },
        },
      });
    }

    if (/start break|lunch|break time|rest/.test(cmd)) {
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: 'Break started. Take your rest. Clock back in within 30 minutes.',
            ta: 'இளைப்பு ஆரம்பம். ஓய்வு எடுங்கள். 30 நிமிடத்தில் திரும்பி வாருங்கள்.',
            hi: 'ब्रेक शुरू। आराम करें। 30 मिनट में वापस आएँ।',
          }),
          language: lang, action: 'break_start',
        },
      });
    }

    if (/end break|back to work|resume/.test(cmd)) {
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: 'Welcome back! Ready to continue working.',
            ta: 'மீண்டும் வரவேற்கிறோம்! தொடர்ந்து வேலை செய்ய தயாராக உள்ளீர்கள்.',
          }),
          language: lang, action: 'break_end',
        },
      });
    }

    if (/what is my task|today.?s work|todays task|my task|inniku enna task|pending task|show task/.test(cmd)) {
      const tasks = await Task.find({ assignedTo: employeeId, status: { $ne: 'completed' }, isDeleted: false })
        .sort({ priority: -1, createdAt: -1 }).limit(5);
      if (tasks.length === 0) {
        return res.json({
          success: true, data: {
            reply: getReply(lang, {
              en: 'You have no pending tasks. Great job!',
              ta: 'உங்களுக்கு நிலுவையில் பணிகள் எதுவும் இல்லை. சிறப்பு!',
              hi: 'आपके पास कोई लंबित कार्य नहीं है। बहुत अच्छे!',
            }),
            language: lang,
          },
        });
      }
      const taskList = tasks.map((t, i) => `  ${i + 1}. ${t.title} (${t.priority || 'normal'})`).join('\n');
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `You have ${tasks.length} task(s):\n${taskList}`,
            ta: `உங்களுக்கு ${tasks.length} பணிகள் உள்ளன:\n${taskList}`,
          }),
          language: lang, tasks: tasks.map(t => ({ id: t._id, title: t.title, status: t.status })),
        },
      });
    }

    if (/start task|begin task|resume task|task start/.test(cmd)) {
      const task = await Task.findOne({ assignedTo: employeeId, status: 'pending', isDeleted: false }).sort({ priority: -1 });
      if (!task) {
        return res.json({ success: true, data: { reply: 'No pending task to start.', language: lang } });
      }
      task.status = 'in_progress';
      await task.save();
      emitToRoom('management', 'employee_activity', {
        employeeId, action: 'start_task', task: task.title, employeeName: req.user.profile?.firstName || 'Employee',
      });
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Started task: ${task.title}. All the best!`,
            ta: `பணி ஆரம்பம்: ${task.title}. வாழ்த்துக்கள்!`,
          }),
          language: lang, action: 'start_task', details: { task: task.title },
        },
      });
    }

    if (/pause task|hold task|stop task|task pause/.test(cmd)) {
      const task = await Task.findOne({ assignedTo: employeeId, status: 'in_progress', isDeleted: false });
      if (!task) return res.json({ success: true, data: { reply: 'No active task to pause.', language: lang } });
      task.status = 'paused';
      await task.save();
      emitToRoom('management', 'employee_activity', { employeeId, action: 'pause_task', task: task.title });
      return res.json({
        success: true, data: {
          reply: getReply(lang, { en: `Paused: ${task.title}`, ta: `நிறுத்தப்பட்டது: ${task.title}` }),
          language: lang, action: 'pause_task',
        },
      });
    }

    if (/complete task|task complete|finish task|done task|i completed/.test(cmd)) {
      const task = await Task.findOne({ assignedTo: employeeId, status: { $in: ['in_progress', 'pending'] }, isDeleted: false })
        .sort({ priority: -1 });
      if (!task) return res.json({ success: true, data: { reply: 'No task to complete.', language: lang } });
      const match = cmd.match(/task\s*(\d+)/);
      const taskToComplete = match && match[1]
        ? await Task.findOne({ assignedTo: employeeId, isDeleted: false }).skip(parseInt(match[1]) - 1)
        : task;
      if (!taskToComplete) return res.json({ success: true, data: { reply: 'Task not found.', language: lang } });
      taskToComplete.status = 'completed';
      taskToComplete.completedAt = new Date();
      await taskToComplete.save();

      emitToRoom('management', 'employee_activity', {
        employeeId, action: 'complete_task', task: taskToComplete.title,
        time: now, employeeName: req.user.profile?.firstName || 'Employee',
      });

      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Task "${taskToComplete.title}" completed! Great work!`,
            ta: `"${taskToComplete.title}" பணி முடிந்தது! சிறப்பான வேலை!`,
            hi: `"${taskToComplete.title}" कार्य पूर्ण! शानदार काम!`,
            tanglish: `"${taskToComplete.title}" task complete aachu! Super!`,
          }),
          language: lang, action: 'complete_task', details: { task: taskToComplete.title, taskId: taskToComplete._id },
        },
      });
    }

    if (/log production|i (stitched|completed|made|finished|produced)\s*\d+|production (\d+)/.test(cmd)) {
      const quantityMatch = cmd.match(/(\d+)/);
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 0;
      const product = cmd.includes('shirt') ? 'shirt' : cmd.includes('pant') ? 'pant' : 'garment';
      if (quantity > 0) {
        const task = await Task.findOne({ assignedTo: employeeId, isDeleted: false }).sort({ createdAt: -1 });
        if (task) {
          task.quantityCompleted = (task.quantityCompleted || 0) + quantity;
          if (task.quantityCompleted >= (task.quantityTarget || 0)) task.status = 'completed';
          await task.save();
        }
        emitToRoom('management', 'employee_activity', {
          employeeId, action: 'production_log', product, quantity,
          time: now, employeeName: req.user.profile?.firstName || 'Employee',
        });
      }
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Logged ${quantity > 0 ? `${quantity} ${product}(s)` : 'production'}. ` + (quantity > 0 ? 'Keep up the good work!' : 'Please specify quantity.'),
            ta: quantity > 0 ? `${quantity} ${product}(கள்) உற்பத்தி பதிவு செய்யப்பட்டது. தொடர்ந்து சிறப்பாக செயல்படுங்கள்!` : 'அளவை குறிப்பிடவும்.',
            tanglish: quantity > 0 ? `${quantity} ${product} production log aachu. Nalla velai!` : 'Quantity solunga.',
          }),
          language: lang, action: 'production_log', details: { product, quantity },
        },
      });
    }

    if (/todays target|today target|production target|target (\d+)/.test(cmd)) {
      const tasks = await Task.find({ assignedTo: employeeId, isDeleted: false });
      const totalTarget = tasks.reduce((s, t) => s + (t.quantityTarget || 0), 0);
      const totalCompleted = tasks.reduce((s, t) => s + (t.quantityCompleted || 0), 0);
      const progress = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Today's target: ${totalTarget} units. Completed: ${totalCompleted} units (${progress}%).`,
            ta: `இன்றைய இலக்கு: ${totalTarget} அலகுகள். முடிந்தது: ${totalCompleted} (${progress}%).`,
            tanglish: `Today target ${totalTarget} units. Complete aachu ${totalCompleted} units (${progress}%).`,
          }),
          language: lang,
        },
      });
    }

    if (/which machine|my machine|machine assigned|enna machine/.test(cmd)) {
      const user = await req.user.populate('assignedLine');
      const machine = await Machine.findOne({ assignedLine: user.assignedLine?._id }).limit(1);
      const machineName = machine?.name || machine?.machineNumber || 'Not assigned';
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Your machine: ${machineName}`,
            ta: `உங்கள் இயந்திரம்: ${machineName}`,
          }),
          language: lang,
        },
      });
    }

    if (/machine health|machine status|machine problem/.test(cmd)) {
      const user = await req.user.populate('assignedLine');
      const machine = await Machine.findOne({ assignedLine: user.assignedLine?._id }).limit(1);
      const status = machine?.status || 'unknown';
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Machine ${machine?.name || ''} status: ${status}`,
            ta: `இயந்திர நிலை: ${status === 'available' ? 'கிடைக்கிறது' : status}`,
          }),
          language: lang,
        },
      });
    }

    if (/how many hours|hours worked|enna neram/.test(cmd)) {
      const dateStr = now.toISOString().split('T')[0];
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const att = await Attendance.findOne({ employee: employeeId, date });
      const hrs = att?.workingHours || 0;
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `You have worked ${hrs} hours today.`,
            ta: `இன்று ${hrs} மணி நேரம் வேலை பார்த்திருக்கிறீர்கள்.`,
            hi: `आज आपने ${hrs} घंटे काम किया है।`,
            tanglish: `Today ${hrs} hours work pannirukinga.`,
          }),
          language: lang,
        },
      });
    }

    if (/show attendance|attendance|hajeri|todays attendance/.test(cmd)) {
      const dateStr = now.toISOString().split('T')[0];
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      const att = await Attendance.findOne({ employee: employeeId, date });
      const clockIn = att?.clockInTime || '--:--';
      const clockOut = att?.clockOutTime || '--:--';
      const hrs = att?.workingHours || 0;
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Today: Clock In: ${clockIn}, Clock Out: ${clockOut}, Hours: ${hrs}h`,
            ta: `இன்று: உள்: ${clockIn}, வெளி: ${clockOut}, மணி: ${hrs}h`,
          }),
          language: lang,
        },
      });
    }

    if (/report issue|create issue|machine problem|fabric shortage|needle broken|quality issue/.test(cmd)) {
      let issueType = 'general';
      if (/machine|needle|stopped/.test(cmd)) issueType = 'machine';
      else if (/fabric|material|cloth/.test(cmd)) issueType = 'material';
      else if (/quality|defect/.test(cmd)) issueType = 'quality';

      const issue = await Issue.create({
        employee: employeeId, type: issueType, description: command,
        priority: issueType === 'machine' ? 'high' : 'medium',
      });

      const Notification = require('../models/Notification');
      await Notification.create({
        recipient: null, sender: employeeId, type: 'issue_report',
        title: `Issue reported: ${issueType}`,
        message: command,
        link: `/issues/${issue._id}`, priority: 'high',
      });

      emitToRoom('management', 'newNotification', {
        type: 'issue_report', title: command.substring(0, 50),
        employeeId, time: now,
      });

      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Issue reported: "${command.substring(0, 50)}". Management has been notified.`,
            ta: `பிரச்சனை பதிவு செய்யப்பட்டது. மேலாண்மைக்கு தெரிவிக்கப்பட்டது.`,
            hi: `समस्या रिपोर्ट की गई। प्रबंधन को सूचित किया गया।`,
            tanglish: `Issue report pannitom. Management ku notification pochu.`,
          }),
          language: lang, action: 'report_issue', details: { issueType, issueId: issue._id },
        },
      });
    }

    if (/my performance|efficiency|quality score|how am i doing/.test(cmd)) {
      const tasks = await Task.find({ assignedTo: employeeId, isDeleted: false });
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Performance: ${rate}% completion rate. ${completed}/${total} tasks completed.`,
            ta: `செயல்திறன்: ${rate}% நிறைவு விகிதம். ${total}-ல் ${completed} பணிகள் முடிந்தன.`,
          }),
          language: lang,
        },
      });
    }

    if (/apply leave|leave request|half day|medical leave/.test(cmd)) {
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: 'Opening leave request page. Please fill in the details.',
            ta: 'விடுப்பு விண்ணப்ப பக்கம் திறக்கிறது. விவரங்களை நிரப்பவும்.',
          }),
          language: lang, action: 'navigate', navigate: `/${req.user.role}/leave-request`,
        },
      });
    }

    if (/open (dashboard|home)/.test(cmd)) {
      return res.json({
        success: true, data: {
          reply: getReply(lang, { en: 'Opening dashboard', ta: 'டாஷ்போர்டு திறக்கிறது' }),
          language: lang, action: 'navigate', navigate: `/${req.user.role}/dashboard`,
        },
      });
    }

    if (/open (attendance|hajeri)/.test(cmd)) {
      return res.json({
        success: true, data: {
          reply: getReply(lang, { en: 'Opening attendance page', ta: 'வருகை பக்கம் திறக்கிறது' }),
          language: lang, action: 'navigate', navigate: `/${req.user.role}/attendance`,
        },
      });
    }

    if (/open (tasks|my tasks)/.test(cmd)) {
      return res.json({
        success: true, data: {
          reply: getReply(lang, { en: 'Opening tasks page', ta: 'பணிகள் பக்கம் திறக்கிறது' }),
          language: lang, action: 'navigate', navigate: `/${req.user.role}/tasks`,
        },
      });
    }

    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'vanakkam', 'வணக்கம்', 'नमस्ते'];
    if (greetings.some(g => cmd.includes(g))) {
      const hour = now.getHours();
      const greet = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: `Good ${greet}! I am your AI assistant. How can I help you today?`,
            ta: `வணக்கம்! நான் உங்கள் AI உதவியாளர். எப்படி உதவ முடியும்?`,
            hi: `नमस्ते! मैं आपका AI सहायक हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?`,
            tanglish: `Good ${greet}! Naan ungaloda AI assistant. Eppadi help pannanum?`,
          }),
          language: lang,
        },
      });
    }

    return res.json({
      success: true, data: {
        reply: getReply(lang, {
          en: 'I understand. You can say: Clock In, Clock Out, My Tasks, My Performance, Show Attendance, Report Issue, or ask me anything about your work.',
          ta: 'புரிந்தது. நீங்கள் சொல்லலாம்: கிளாக் இன், கிளாக் அவுட், எனது பணிகள், எனது செயல்திறன், வருகை காண்பி, பிரச்சனை தெரிவி',
          hi: 'समझ गया। आप कह सकते हैं: क्लॉक इन, क्लॉक आउट, मेरे कार्य, मेरा प्रदर्शन, उपस्थिति दिखाएँ, समस्या रिपोर्ट करें',
          tanglish: 'Puriyudhu. Neenga solalam: Clock In, Clock Out, My Tasks, My Performance, Show Attendance, Report Issue',
        }),
        language: lang,
      },
    });
  } catch (err) {
    console.error('Voice command error:', err);
    return res.json({
      success: true, data: {
        reply: 'I encountered an error processing your request. Please try again.',
        language: 'en',
      },
    });
  }
};
