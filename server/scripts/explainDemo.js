require('dotenv').config();

const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const connectDB = require('../config/db');

function collectPlanDetails(node, stages = [], indexes = []) {
  if (!node || typeof node !== 'object') return { stages, indexes };
  if (node.stage) stages.push(node.stage);
  if (node.indexName) indexes.push(node.indexName);
  for (const [key, value] of Object.entries(node)) {
    if (['inputStage', 'inputStages', 'outerStage', 'innerStage', 'queryPlan', 'winningPlan', 'executionStages', 'shards'].includes(key)) {
      if (Array.isArray(value)) value.forEach((child) => collectPlanDetails(child, stages, indexes));
      else collectPlanDetails(value, stages, indexes);
    }
  }
  return { stages, indexes };
}

async function explain(name, query) {
  const details = await query.explain('executionStats');
  const plan = collectPlanDetails(details.queryPlanner?.winningPlan || {});
  return {
    queryName: name,
    winningStages: [...new Set(plan.stages)].join(' -> ') || 'n/a',
    indexNameUsed: [...new Set(plan.indexes)].join(', ') || 'none (COLLSCAN or no index reported)',
    totalDocsExamined: details.executionStats?.totalDocsExamined ?? 0,
    totalKeysExamined: details.executionStats?.totalKeysExamined ?? 0,
    nReturned: details.executionStats?.nReturned ?? 0
  };
}

async function run() {
  await connectDB();
  const id = new mongoose.Types.ObjectId();
  const checks = [
    ['Events text search', Event.find({ $text: { $search: 'campus event' } })],
    ['Events status and startAt sort', Event.find({
      status: 'published',
      'schedule.startAt': { $gte: new Date() }
    }).sort({ 'schedule.startAt': 1 })],
    ['Registrations by event and status', Registration.find({ event: id, status: 'registered' })],
    ['Registrations by user', Registration.find({ user: id })],
    ['Attendance by event', Attendance.find({ event: id })],
    ['Users by email', User.find({ email: 'explain-demo@example.invalid' })]
  ];
  const results = await Promise.all(checks.map(([name, query]) => explain(name, query)));
  console.table(results);
  console.log('Explain completed. This script only inspected query plans; it did not modify records.');
}

run()
  .catch((error) => {
    console.error(`Explain demo failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
