import crypto from 'crypto';

const JOB_TTL_MS = 10 * 60 * 1000; // 10 minutes
const jobs = new Map();

// Periodic cleanup of stale cached audio buffers
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobs.delete(jobId);
    }
  }
}, 60 * 1000).unref();

export function createJob({ file, duration, fileName, fileSize }) {
  const jobId = crypto.randomUUID();
  const job = {
    id: jobId,
    file,
    duration,
    fileName: fileName || file?.originalname || 'Audio Recording',
    fileSize: fileSize || file?.size || null,
    transcript: null,
    createdAt: Date.now()
  };
  jobs.set(jobId, job);
  return job;
}

export function getJob(jobId) {
  if (!jobId || !jobs.has(jobId)) {
    return null;
  }
  const job = jobs.get(jobId);
  if (Date.now() - job.createdAt > JOB_TTL_MS) {
    jobs.delete(jobId);
    return null;
  }
  return job;
}

export function updateJobTranscript(jobId, transcript) {
  const job = getJob(jobId);
  if (job) {
    job.transcript = transcript;
  }
  return job;
}

export function deleteJob(jobId) {
  if (jobId) {
    jobs.delete(jobId);
  }
}
