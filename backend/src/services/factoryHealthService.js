const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, Number(n) || 0));

const WEIGHTS = {
  production: 0.25,
  quality: 0.2,
  machines: 0.2,
  inventory: 0.15,
  workforce: 0.1,
  delivery: 0.1,
};

const COMPONENT_LABELS = {
  production: 'Production Throughput',
  quality: 'Quality Control',
  machines: 'Machine Health',
  inventory: 'Material Readiness',
  workforce: 'Workforce Presence',
  delivery: 'Order Delivery',
};

function gradeFor(score) {
  if (score >= 85) return { grade: 'A', label: 'Excellent', tone: '#16A34A' };
  if (score >= 70) return { grade: 'B', label: 'Good', tone: '#2C8C8C' };
  if (score >= 55) return { grade: 'C', label: 'Watch', tone: '#E8A06B' };
  return { grade: 'D', label: 'Critical', tone: '#DC2626' };
}

function severityFor(score) {
  if (score >= 85) return 'info';
  if (score >= 70) return 'info';
  if (score >= 55) return 'warning';
  return 'critical';
}

function normalizeItem(item) {
  const stock = item.stockLevels || {};
  return {
    ...item,
    current: Number(stock.current) || 0,
    minimum: Number(stock.minimum) || 0,
    reorderPoint: Number(stock.reorderPoint) || 0,
    maximum: Number(stock.maximum) || 0,
  };
}

function computeComponentScores(data) {
  const { kpis = {}, machines = {}, inventory = {}, quality = {}, workforce = {}, lines = [] } = data;

  const totalOrders = kpis.ordersTotal || 0;
  const healthyOrders = (kpis.completedOrders || 0) + (kpis.deliveredOrders || 0);
  const activeOrders = kpis.activeOrders || 0;
  const taskTotal = kpis.tasksTotal || 0;
  const taskCompleted = kpis.tasksCompleted || 0;

  const completionRate = taskTotal > 0 ? (taskCompleted / taskTotal) * 100 : (totalOrders > 0 ? (healthyOrders / totalOrders) * 100 : 70);
  const activePressure = totalOrders > 0 ? (activeOrders / totalOrders) * 100 : 0;
  const productionScore = clamp(completionRate * 0.7 + (100 - activePressure) * 0.3);

  const inspected = quality.passFail ? quality.passFail.totalInspected : (quality.overall ? quality.overall.totalInspected : 0);
  const failed = quality.passFail ? quality.passFail.totalFailed : (quality.overall ? quality.overall.totalFailed : 0);
  const defectRate = inspected > 0 ? (failed / inspected) * 100 : (quality.overall ? Number(quality.overall.avgDefectRate) || 0 : 0);
  const qualityScore = clamp(100 - defectRate * 2.2);

  const machineTotal = machines.total || 0;
  const machineUsable = (machines.byStatus.available || 0) + (machines.byStatus.in_use || 0);
  const machineAvailability = machineTotal > 0 ? (machineUsable / machineTotal) * 100 : 100;
  const avgEfficiency = machines.avgEfficiency || 0;
  const maintenanceDue = machines.maintenanceDue || 0;
  const machineScore = clamp(machineAvailability * 0.6 + avgEfficiency * 0.4 - maintenanceDue * 4);

  const inventoryTotal = inventory.totalItems || 0;
  const lowStock = inventory.lowStockCount || 0;
  const stockReady = inventoryTotal > 0 ? ((inventoryTotal - lowStock) / inventoryTotal) * 100 : 100;
  const inventoryScore = clamp(stockReady * 0.9 - lowStock * 1.5);

  const totalStaff = workforce.totalEmployees || 0;
  const present = workforce.attendanceToday ? workforce.attendanceToday.present : 0;
  const attendanceRate = totalStaff > 0 ? (present / totalStaff) * 100 : 100;
  const openIssues = workforce.openIssues || 0;
  const pendingLeaves = workforce.pendingLeaves || 0;
  const workforceScore = clamp(attendanceRate * 0.7 + Math.max(0, 100 - openIssues * 6 - pendingLeaves * 4));

  const deliveryScore = totalOrders > 0 ? clamp((healthyOrders / totalOrders) * 100) : 75;

  const components = [
    { key: 'production', score: Math.round(productionScore), weight: WEIGHTS.production },
    { key: 'quality', score: Math.round(qualityScore), weight: WEIGHTS.quality },
    { key: 'machines', score: Math.round(machineScore), weight: WEIGHTS.machines },
    { key: 'inventory', score: Math.round(inventoryScore), weight: WEIGHTS.inventory },
    { key: 'workforce', score: Math.round(workforceScore), weight: WEIGHTS.workforce },
    { key: 'delivery', score: Math.round(deliveryScore), weight: WEIGHTS.delivery },
  ];

  return {
    components,
    detail: {
      completionRate: Math.round(completionRate),
      defectRate: Math.round(defectRate * 100) / 100,
      machineAvailability: Math.round(machineAvailability),
      avgEfficiency: Math.round(avgEfficiency),
      stockReady: Math.round(stockReady),
      attendanceRate: Math.round(attendanceRate),
    },
  };
}

function buildRecommendations(data) {
  const recommendations = [];
  const { kpis = {}, machines = {}, inventory = {}, workforce = {}, quality = {} } = data;
  const now = new Date();
  const nextId = () =>
    `rec_${Date.now().toString(36)}_${recommendations.length}_${Math.random().toString(36).slice(2, 6)}`;

  const defectRate = quality.overall ? Number(quality.overall.avgDefectRate) || 0 : 0;

  (inventory.lowStockItems || []).forEach((raw) => {
    const item = normalizeItem(raw);
    recommendations.push({
      id: nextId(),
      category: 'inventory',
      severity: item.current === 0 ? 'critical' : 'warning',
      title: `Reorder: ${item.name}`,
      description:
        `${item.name} is below its reorder point (${item.current} ${item.unitOfMeasure} remaining, reorder at ${item.reorderPoint}). ` +
        `Supplier lead time is ${item.supplier?.leadTime ? `${item.supplier.leadTime} days` : 'unknown'}.`,
      action: 'Create reorder',
      link: '/admin/inventory',
      timestamp: now.toISOString(),
      source: 'InventoryPredictionAI',
      confidence: 0.9,
    });
  });

  if (defectRate > 5) {
    recommendations.push({
      id: nextId(),
      category: 'quality',
      severity: 'warning',
      title: `Defect rate is elevated at ${defectRate.toFixed(1)}%`,
      description:
        'Inspection data shows defect rate above the 5% healthy threshold. Consider targeted operator training and root-cause analysis on the most affected stations.',
      action: 'Open quality analytics',
      link: '/admin/quality',
      timestamp: now.toISOString(),
      source: 'QualityAI',
      confidence: 0.85,
    });
  }

  (machines.maintenanceQueue || []).forEach((m) => {
    recommendations.push({
      id: nextId(),
      category: 'machine',
      severity: 'warning',
      title: `Preventive maintenance due: ${m.name}`,
      description: `Next service is scheduled for ${new Date(m.nextServiceDate).toLocaleDateString()}. Scheduling maintenance now reduces unplanned downtime risk.`,
      action: 'Schedule maintenance',
      link: '/admin/machines',
      timestamp: now.toISOString(),
      source: 'MachinePredictionAI',
      confidence: 0.88,
    });
  });

  (kpis.urgentOrders || []).forEach((o) => {
    recommendations.push({
      id: nextId(),
      category: 'orders',
      severity: 'critical',
      title: `Urgent order at risk: ${o.orderNumber}`,
      description: `Order for ${o.customerName || 'client'} (${o.quantity} units, ${o.garmentType}) is ${o.status.replace('_', ' ')} and requires immediate line assignment to meet the ${new Date(o.requiredDate).toLocaleDateString()} deadline.`,
      action: 'Assign to line',
      link: '/admin/orders',
      timestamp: now.toISOString(),
      source: 'FactoryHealthAI',
      confidence: 0.9,
    });
  });

  if ((kpis.delayedTasks || 0) > 0) {
    recommendations.push({
      id: nextId(),
      category: 'tasks',
      severity: 'warning',
      title: `${kpis.delayedTasks} task(s) are behind schedule`,
      description: 'Delayed tasks reduce line throughput and can cascade into delivery risk. Review assignments and rebalance workload across available operators.',
      action: 'Review tasks',
      link: '/admin/analytics',
      timestamp: now.toISOString(),
      source: 'FactoryHealthAI',
      confidence: 0.8,
    });
  }

  if ((workforce.openIssues || 0) > 0) {
    recommendations.push({
      id: nextId(),
      category: 'workforce',
      severity: 'warning',
      title: `${workforce.openIssues} open issue(s) need attention`,
      description: 'Open issue reports from the floor should be triaged promptly to keep operations smooth and morale high.',
      action: 'View issues',
      link: '/admin/users',
      timestamp: now.toISOString(),
      source: 'FactoryHealthAI',
      confidence: 0.75,
    });
  }

  if ((workforce.pendingLeaves || 0) > 0) {
    recommendations.push({
      id: nextId(),
      category: 'workforce',
      severity: 'info',
      title: `${workforce.pendingLeaves} leave request(s) awaiting approval`,
      description: 'Approve or reject pending leave requests so shift coverage can be planned ahead of time.',
      action: 'Review leaves',
      link: '/admin/users',
      timestamp: now.toISOString(),
      source: 'FactoryHealthAI',
      confidence: 0.7,
    });
  }

  const linePressure = (data.lines || []).filter(
    (l) => l.activeOrders && l.activeOrders >= (l.capacity ? Math.ceil((l.capacity.daily || 0) / 250) + 2 : 4),
  );
  if (linePressure.length > 0) {
    recommendations.push({
      id: nextId(),
      category: 'production',
      severity: 'warning',
      title: 'Production lines are overloaded',
      description: `${linePressure.map((l) => l.name).join(', ')} is carrying more active orders than planned capacity. Rebalance orders or add shifts.`,
      action: 'Open production lines',
      link: '/admin/production-lines',
      timestamp: now.toISOString(),
      source: 'ProductionAI',
      confidence: 0.82,
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: nextId(),
      category: 'health',
      severity: 'info',
      title: 'All systems operating within healthy ranges',
      description:
        'No critical exceptions detected across orders, machines, inventory, quality or workforce. Continue monitoring live telemetry.',
      action: null,
      link: null,
      timestamp: now.toISOString(),
      source: 'FactoryHealthAI',
      confidence: 0.95,
    });
  }

  recommendations.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  return recommendations;
}

function buildAlerts(data) {
  const alerts = [];
  const { kpis = {}, machines = {}, inventory = {}, workforce = {} } = data;
  if (machines.repair && machines.repair > 0) {
    alerts.push({ severity: 'critical', message: `${machines.repair} machine(s) currently in repair.` });
  }
  if ((kpis.delayedTasks || 0) > 0) {
    alerts.push({ severity: 'warning', message: `${kpis.delayedTasks} delayed production task(s).` });
  }
  if ((inventory.lowStockCount || 0) > 0) {
    alerts.push({ severity: 'warning', message: `${inventory.lowStockCount} material(s) below reorder point.` });
  }
  if ((workforce.openIssues || 0) > 0) {
    alerts.push({ severity: 'info', message: `${workforce.openIssues} open floor issue(s).` });
  }
  return alerts;
}

function computeFactoryHealth(data = {}) {
  const { components, detail } = computeComponentScores(data);

  let score = 0;
  components.forEach((c) => {
    score += c.score * c.weight;
  });
  score = Math.round(clamp(score));

  const grade = gradeFor(score);
  const recommendations = buildRecommendations(data);
  const alerts = buildAlerts(data);

  const summaries = {
    A: 'Factory is operating at excellent levels across production, quality, machines, materials and workforce.',
    B: 'Factory performance is healthy with minor opportunities for improvement.',
    C: 'Factory health is at watch level. Some areas need attention to avoid cascading issues.',
    D: 'Factory health is critical. Immediate management action is required on multiple fronts.',
  };

  let summary = summaries[grade.grade];

  const notes = [];
  if ((data.kpis && (data.kpis.ordersTotal || 0) === 0 && (data.kpis.tasksTotal || 0) === 0)) {
    notes.push('No orders or production tasks in the system yet — throughput components are neutral until production data arrives.');
  }
  const totalStaff = data.workforce ? data.workforce.totalEmployees || 0 : 0;
  const attendanceRecorded = data.workforce && data.workforce.attendanceToday ? data.workforce.attendanceToday.total || 0 : 0;
  if (totalStaff > 0 && attendanceRecorded === 0) {
    notes.push('No attendance recorded today yet — workforce presence is neutral until employees clock in.');
  }
  if (notes.length > 0) {
    summary = `${summary} ${notes.join(' ')}`;
  }

  return {
    score,
    grade: grade.grade,
    label: grade.label,
    tone: grade.tone,
    summary,
    notes,
    detail,
    componentScores: components.map((c) => ({
      key: c.key,
      label: COMPONENT_LABELS[c.key],
      score: c.score,
      weight: c.weight,
      status: severityFor(c.score),
    })),
    recommendations,
    alerts,
    engine: 'FactoryHealthAI',
    method: 'rule-based',
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { computeFactoryHealth };
