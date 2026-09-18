const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const Machine = require('../models/Machine');
const { emitToUser, emitToRoom, emitToAll } = require('../services/socketService');
const GroqService = require('../ai/GroqService');

const LANG_MAP = {
  en: 'en', ta: 'ta', hi: 'hi', kn: 'kn', ml: 'ml', te: 'te', tanglish: 'tanglish',
};

const CENTRALIZED_TRANSLATIONS = {
  kn: {
    clock_in: 'ಶಿಫ್ಟ್ ಪ್ರಾರಂಭವಾಗಿದೆ. ಶುಭ ದಿನ!',
    clock_out: 'ಶಿಫ್ಟ್ ಪೂರ್ಣಗೊಂಡಿದೆ. ಸುರಕ್ಷಿತವಾಗಿ ಮನೆಗೆ ಹೋಗಿ!',
    task_start: 'ಕೆಲಸ ಪ್ರಾರಂಭವಾಗಿದೆ.',
    task_pause: 'ಕೆಲಸವನ್ನು ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ.',
    task_complete: 'ಕೆಲಸ ಪೂರ್ಣಗೊಂಡಿದೆ. ಗುಣಮಟ್ಟ ಪರಿಶೀಲನೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ.',
    production_log: 'ಉತ್ಪಾದನೆ ದಾಖಲಾಗಿದೆ.',
    issue_report: 'ಸಮಸ್ಯೆ ದಾಖಲಾಗಿದೆ. ನಿರ್ವಹಣೆಗೆ ತಿಳಿಸಲಾಗಿದೆ.',
    todays_target: 'ಇಂದಿನ ಗುರಿ',
    which_machine: 'ನಿಯೋಜಿಸಲಾದ ಯಂತ್ರ',
    machine_health: 'ಯಂತ್ರ ಸ್ಥಿತಿ ಉತ್ತಮವಾಗಿದೆ.',
    how_many_hours: 'ಇಲ್ಲಿಯವರೆಗೆ ಕೆಲಸ ಮಾಡಿದ ಸಮಯ',
    opening_dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ',
    opening_attendance: 'ಹಾಜರಾತಿ ಪುಟ ತೆರೆಯಲಾಗುತ್ತಿದೆ',
    opening_tasks: 'ಕೆಲಸಗಳ ಪುಟ ತೆರೆಯಲಾಗುತ್ತಿದೆ',
    default: 'ಆಜ್ಞೆಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗಿದೆ.'
  },
  ml: {
    clock_in: 'ഷിഫ്റ്റ് ആരംഭിച്ചു. ശുഭദിനം!',
    clock_out: 'ഷിഫ്റ്റ് പൂർത്തിയായി. സുരക്ഷിതമായി വീട്ടിൽ പോകുക!',
    task_start: 'ജോലി ആരംഭിച്ചു.',
    task_pause: 'ജോലി താൽക്കാലികമായി നിർത്തിവെച്ചു.',
    task_complete: 'ജോലി പൂർത്തിയായി. ക്വാളിറ്റി ചെക്കിനായി സമർപ്പിച്ചു.',
    production_log: 'ഉത്പാദനം രേഖപ്പെടുത്തി.',
    issue_report: 'പ്രശ്നം രേഖപ്പെടുത്തി. മാനേജ്മെന്റിനെ അറിയിച്ചു.',
    todays_target: 'ഇന്നത്തെ ലക്ഷ్యం',
    which_machine: 'അനുവദിച്ച മെഷീൻ',
    machine_health: 'മെഷീൻ ആരോഗ്യനില തൃപ്തികരമാണ്.',
    how_many_hours: 'ഇതുവരെ ജോലി ചെയ്ത സമയം',
    opening_dashboard: 'ഡാഷ്‌ബോർഡ് തുറക്കുന്നു',
    opening_attendance: 'ഹാജർ പേജ് തുറക്കുന്നു',
    opening_tasks: 'ടാസ്‌ക് പേജ് തുറക്കുന്നു',
    default: 'കമാൻഡ് പ്രോസസ്സ് ചെയ്തു.'
  },
  te: {
    clock_in: 'షిఫ్ట్ ప్రారంభమైంది. శుభదినం!',
    clock_out: 'షిఫ్ట్ పూర్తయింది. క్షేమంగా ఇంటికి వెళ్ళండి!',
    task_start: 'పని ప్రారంభమైంది.',
    task_pause: 'పని నిలిపివేయబడింది.',
    task_complete: 'పని పూర్తయింది. నాణ్యత పరిశీలనకు పంపబడింది.',
    production_log: 'ఉత్పత్తి నమోదు చేయబడింది.',
    issue_report: 'సమస్య నమోదైంది. యాజమాన్యానికి తెలియజేయబడింది.',
    todays_target: 'ఇవాల్టి లక్ష్యం',
    which_machine: 'కేటాయించిన యంత్రం',
    machine_health: 'యంత్రం పనితీరు బాగుంది.',
    how_many_hours: 'ఇప్పటివరకు పని చేసిన సమయం',
    opening_dashboard: 'డ్యాష్‌బోర్డ్ తెరవబడుతోంది',
    opening_attendance: 'ఆహ్వానం పేజీ తెరవబడుతోంది',
    opening_tasks: 'పనుల పేజీ తెరవబడుతోంది',
    default: 'ఆదేశం ప్రాసెస్ చేయబడింది.'
  }
};

function getReply(lang, replies) {
  if (replies[lang]) return replies[lang];
  
  if (['kn', 'ml', 'te'].includes(lang)) {
    const enText = (replies.en || '').toLowerCase();
    const translations = CENTRALIZED_TRANSLATIONS[lang];
    
    if (enText.includes('clocked in') || enText.includes('clock in')) return translations.clock_in;
    if (enText.includes('clocked out') || enText.includes('clock out')) return translations.clock_out;
    if (enText.includes('started production') || enText.includes('task started') || enText.includes('begun')) return translations.task_start;
    if (enText.includes('paused') || enText.includes('pause')) return translations.task_pause;
    if (enText.includes('completed') || enText.includes('complete') || enText.includes('finished')) return translations.task_complete;
    if (enText.includes('logged') || enText.includes('production updated')) return translations.production_log;
    if (enText.includes('issue reported') || enText.includes('reported issue') || enText.includes('shortage')) return translations.issue_report;
    if (enText.includes('target')) return `${translations.todays_target}: ${replies.en.replace(/[a-zA-Z:]/g, '').trim()}`;
    if (enText.includes('machine') && enText.includes('assigned')) return translations.which_machine;
    if (enText.includes('machine') && enText.includes('health')) return translations.machine_health;
    if (enText.includes('worked') || enText.includes('hours')) return translations.how_many_hours;
    if (enText.includes('opening dashboard')) return translations.opening_dashboard;
    if (enText.includes('opening attendance')) return translations.opening_attendance;
    if (enText.includes('opening tasks')) return translations.opening_tasks;
    
    return replies.en;
  }
  
  return replies.en || 'Command processed';
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

    // Call unified Groq parser
    const parsed = await GroqService.parseEmployeeCommand(command);
    if (parsed && parsed.intent !== 'UNKNOWN') {
      const intent = parsed.intent;

      if (intent === 'START_TASK') {
        const task = await Task.findOne({ assignedTo: employeeId, status: { $in: ['pending', 'accepted', 'paused'] }, isDeleted: false });
        if (task) {
          task.status = 'in_progress';
          task.timeline.startedAt = now;
          await task.save();
          emitToRoom('management', 'employee_activity', {
            employeeId, action: 'start_task', task: task.title, employeeName: req.user.profile?.firstName || 'Employee',
          });
          emitToUser(employeeId, 'taskUpdated', { action: 'statusChanged', task });
          return res.json({
            success: true,
            data: { reply: `Started task: ${task.title}. Keep up the pace!`, language: lang, action: 'start_task' }
          });
        }
      }

      if (intent === 'PAUSE_TASK') {
        const task = await Task.findOne({ assignedTo: employeeId, status: 'in_progress', isDeleted: false });
        if (task) {
          task.status = 'paused';
          task.timeline.pausedAt = now;
          await task.save();
          emitToRoom('management', 'employee_activity', {
            employeeId, action: 'pause_task', task: task.title, employeeName: req.user.profile?.firstName || 'Employee',
          });
          emitToUser(employeeId, 'taskUpdated', { action: 'statusChanged', task });
          return res.json({
            success: true,
            data: { reply: `Paused task: ${task.title}.`, language: lang, action: 'pause_task' }
          });
        }
      }

      if (intent === 'UPDATE_PRODUCTION') {
        const qty = parsed.quantity || 1;
        const task = await Task.findOne({ assignedTo: employeeId, status: { $in: ['in_progress', 'accepted', 'rework'] }, isDeleted: false });
        if (task) {
          task.quantity.produced = (task.quantity.produced || 0) + qty;
          
          if (task.quantity.produced >= task.quantity.target) {
            task.status = 'quality_check'; // Triggers inspection workflow!
          } else {
            task.status = 'in_progress';
          }
          await task.save();

          emitToRoom('management', 'employee_activity', {
            employeeId, action: 'production_log', quantity: qty, product: 'garments', employeeName: req.user.profile?.firstName || 'Employee',
          });
          emitToUser(employeeId, 'taskUpdated', { action: 'progress', task });

          // Send update notification to management
          emitToRoom('management', 'productionUpdated', { taskId: task._id, quantity: qty, produced: task.quantity.produced, target: task.quantity.target });

          return res.json({
            success: true,
            data: { 
              reply: `Logged ${qty} garments. Total produced is now ${task.quantity.produced} out of ${task.quantity.target}.` + 
                     (task.status === 'quality_check' ? ' Submitting task to Quality Control.' : ''),
              language: lang, 
              action: 'production_log' 
            }
          });
        }
      }

      if (intent === 'REPORT_ISSUE') {
        const type = parsed.type || 'general';
        const desc = parsed.description || command;
        const issue = await Issue.create({
          employee: employeeId, type, description: desc,
          priority: type === 'machine' ? 'high' : 'medium',
        });

        const User = require('../models/User');
        const managers = await User.find({ role: { $in: ['manager', 'admin'] }, active: true });
        
        if (managers && managers.length > 0) {
          for (const mgr of managers) {
            await Notification.create({
              recipient: mgr._id, sender: employeeId, type: 'issue_report',
              title: `Issue reported: ${type}`,
              message: desc,
              link: `/issues/${issue._id}`, priority: 'high',
            });
            emitToUser(mgr._id.toString(), 'newNotification', {
              type: 'issue_report',
              title: `Issue reported: ${type}`,
              message: desc.substring(0, 50),
              employeeId, time: now,
            });
          }
        } else {
          console.warn('No active managers or admins found to notify.');
        }

        emitToRoom('management', 'newNotification', {
          type: 'issue_report', title: desc.substring(0, 50),
          employeeId, time: now,
        });

        return res.json({
          success: true,
          data: { reply: `Reported ${type} issue. Management has been notified.`, language: lang, action: 'report_issue' }
        });
      }
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
      let remaining = 0;
      let target = 0;
      let totalProduced = 0;

      if (quantity > 0) {
        const task = await Task.findOne({ assignedTo: employeeId, status: { $in: ['in_progress', 'accepted', 'rework'] }, isDeleted: false }).sort({ createdAt: -1 });
        if (task) {
          task.quantity.produced = (task.quantity.produced || 0) + quantity;
          if (task.quantity.produced >= (task.quantity.target || 0)) {
            task.status = 'quality_check';
          } else {
            task.status = 'in_progress';
          }
          await task.save();
          target = task.quantity.target || 0;
          totalProduced = task.quantity.produced;
          remaining = Math.max(0, target - totalProduced);

          emitToRoom('management', 'employee_activity', {
            employeeId, action: 'production_log', product, quantity,
            time: now, employeeName: req.user.profile?.firstName || 'Employee',
          });
          emitToUser(employeeId.toString(), 'taskUpdated', { action: 'progress', task });
          emitToRoom('management', 'productionUpdated', { taskId: task._id, quantity, produced: totalProduced, target });
        }
      }
      return res.json({
        success: true, data: {
          reply: getReply(lang, {
            en: quantity > 0 
              ? `Production updated. ${quantity} pieces completed. ${remaining} pieces remaining.` 
              : 'Please specify quantity.',
            ta: quantity > 0 ? `${quantity} ${product}(கள்) உற்பத்தி பதிவு செய்யப்பட்டது. இன்னும் ${remaining} மீதமுள்ளது.` : 'அளவை குறிப்பிடவும்.',
            tanglish: quantity > 0 ? `${quantity} ${product} production log aachu. ${remaining} pieces remaining.` : 'Quantity solunga.',
          }),
          language: lang, action: 'production_log', details: { product, quantity, remaining, target, produced: totalProduced },
        },
      });
    }

    if (/todays target|today target|production target|target (\d+)/.test(cmd)) {
      const tasks = await Task.find({ assignedTo: employeeId, isDeleted: false });
      const totalTarget = tasks.reduce((s, t) => s + (t.quantity?.target || 0), 0);
      const totalCompleted = tasks.reduce((s, t) => s + (t.quantity?.produced || 0), 0);
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
      const User = require('../models/User');
      const managers = await User.find({ role: { $in: ['manager', 'admin'] }, active: true });
      
      if (managers && managers.length > 0) {
        for (const mgr of managers) {
          await Notification.create({
            recipient: mgr._id, sender: employeeId, type: 'issue_report',
            title: `Issue reported: ${issueType}`,
            message: command,
            link: `/issues/${issue._id}`, priority: 'high',
          });
          emitToUser(mgr._id.toString(), 'newNotification', {
            type: 'issue_report',
            title: `Issue reported: ${issueType}`,
            message: command.substring(0, 50),
            employeeId, time: now,
          });
        }
      } else {
        console.warn('No active managers or admins found to notify.');
      }

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
    // 1. Check logged in users / attendance / who is working today
    if (/which user|who logged in|logged in today|who is online|who is present|active users|logged in|attendance today/.test(cmd)) {
      const User = require('../models/User');
      const Attendance = require('../models/Attendance');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const loggedInUsers = await User.find({
        $or: [
          { lastLogin: { $gte: todayStart } },
          { active: true },
        ],
      }).select('email role profile lastLogin active').limit(10);

      const todayAttendance = await Attendance.find({
        date: { $gte: todayStart },
      }).populate('employee', 'email profile role');

      if (loggedInUsers.length === 0 && todayAttendance.length === 0) {
        return res.json({
          success: true,
          data: {
            reply: 'No active employee sessions logged for today yet.',
            language: lang,
          },
        });
      }

      const userList = loggedInUsers.map((u) => {
        const name = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim() || u.email;
        const time = u.lastLogin
          ? new Date(u.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Active';
        return `• ${name} [${u.role.toUpperCase()}] - ${time}`;
      });

      return res.json({
        success: true,
        data: {
          reply: `Users logged in / active today (${loggedInUsers.length}):\n${userList.join('\n')}`,
          language: lang,
        },
      });
    }

    // 2. Exact word boundary match for greetings (prevents 'which', 'machine', 'shift' from matching 'hi')
    const greetingRegex = /\b(hello|hi|hey|good\s+morning|good\s+afternoon|good\s+evening|vanakkam|வணக்கம்|नमस्ते)\b/i;
    if (greetingRegex.test(cmd)) {
      const hour = now.getHours();
      const greet = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
      return res.json({
        success: true,
        data: {
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

    // 3. General AI Fallback answering factory intelligence questions
    try {
      const { getPrediction } = require('../services/aiService');
      const aiReply = await getPrediction('general_query', { question: command, userRole: req.user.role });
      if (aiReply) {
        let cleanText = aiReply;
        try {
          const parsedObj = JSON.parse(aiReply);
          cleanText = parsedObj.recommendation || parsedObj.prediction || parsedObj.answer || aiReply;
        } catch {}
        return res.json({
          success: true,
          data: {
            reply: cleanText,
            language: lang,
          },
        });
      }
    } catch {}

    return res.json({
      success: true,
      data: {
        reply: getReply(lang, {
          en: 'I understand. You can say: "Which users logged in today", "Clock In", "Clock Out", "My Tasks", "My Performance", "Show Attendance", or "Report Issue".',
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
      success: true,
      data: {
        reply: 'I encountered an error processing your request. Please try again.',
        language: 'en',
      },
    });
  }
};
