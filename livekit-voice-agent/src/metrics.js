const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

class MetricsLogger {
  constructor(sessionId, userId) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.startTime = Date.now();
    this.metrics = {
      sessionId,
      userId,
      startTime: new Date().toISOString(),
      endTime: null,
      totalDuration: 0,
      interruptions: 0,
      turns: 0,
      latencies: {
        stt: [],
        llm: [],
        tts: [],
        total: []
      },
      delays: {
        eou: [], // End-of-utterance delay
        ttft: [], // Time to first token
        ttfb: []  // Time to first byte
      }
    };
  }
  
  startProcessing() {
    this.metrics.turns += 1;
  }
  
  logSTTLatency(latency) {
    this.metrics.latencies.stt.push(latency);
  }
  
  logLLMLatency(latency) {
    this.metrics.latencies.llm.push(latency);
  }
  
  logTTSLatency(latency) {
    this.metrics.latencies.tts.push(latency);
  }
  
  logTotalLatency(latency) {
    this.metrics.latencies.total.push(latency);
  }
  
  logEOUDelay(delay) {
    this.metrics.delays.eou.push(delay);
  }
  
  logTTFT(delay) {
    this.metrics.delays.ttft.push(delay);
  }
  
  logTTFB(delay) {
    this.metrics.delays.ttfb.push(delay);
  }
  
  logInterruption() {
    this.metrics.interruptions += 1;
  }
  
  getMetrics() {
    return {
      ...this.metrics,
      averages: {
        sttLatency: this.calculateAverage(this.metrics.latencies.stt),
        llmLatency: this.calculateAverage(this.metrics.latencies.llm),
        ttsLatency: this.calculateAverage(this.metrics.latencies.tts),
        totalLatency: this.calculateAverage(this.metrics.latencies.total),
        eouDelay: this.calculateAverage(this.metrics.delays.eou),
        ttft: this.calculateAverage(this.metrics.delays.ttft),
        ttfb: this.calculateAverage(this.metrics.delays.ttfb)
      }
    };
  }
  
  calculateAverage(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
  
  async saveToExcel() {
    // Update end time and total duration
    this.metrics.endTime = new Date().toISOString();
    this.metrics.totalDuration = Date.now() - this.startTime;
    
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    
    // Create metrics sheet
    const metricsSheet = workbook.addWorksheet('Session Metrics');
    
    // Session Info
    metricsSheet.addRow(['Session ID', this.sessionId]);
    metricsSheet.addRow(['User ID', this.userId]);
    metricsSheet.addRow(['Start Time', this.metrics.startTime]);
    metricsSheet.addRow(['End Time', this.metrics.endTime]);
    metricsSheet.addRow(['Total Duration (ms)', this.metrics.totalDuration]);
    metricsSheet.addRow(['Total Turns', this.metrics.turns]);
    metricsSheet.addRow(['Interruptions', this.metrics.interruptions]);
    metricsSheet.addRow([]);
    
    // Average Latencies
    metricsSheet.addRow(['Metric', 'Average (ms)', 'Target (ms)', 'Status']);
    
    const avgSTT = this.calculateAverage(this.metrics.latencies.stt);
    const avgLLM = this.calculateAverage(this.metrics.latencies.llm);
    const avgTTS = this.calculateAverage(this.metrics.latencies.tts);
    const avgTotal = this.calculateAverage(this.metrics.latencies.total);
    const avgEOU = this.calculateAverage(this.metrics.delays.eou);
    const avgTTFT = this.calculateAverage(this.metrics.delays.ttft);
    const avgTTFB = this.calculateAverage(this.metrics.delays.ttfb);
    
    // Status evaluation function
    const getStatus = (value, target) => value <= target ? 'Good' : 'Needs Improvement';
    
    metricsSheet.addRow(['STT Latency', avgSTT, 500, getStatus(avgSTT, 500)]);
    metricsSheet.addRow(['LLM Latency', avgLLM, 800, getStatus(avgLLM, 800)]);
    metricsSheet.addRow(['TTS Latency', avgTTS, 500, getStatus(avgTTS, 500)]);
    metricsSheet.addRow(['Total Latency', avgTotal, 2000, getStatus(avgTotal, 2000)]);
    metricsSheet.addRow(['EOU Delay', avgEOU, 300, getStatus(avgEOU, 300)]);
    metricsSheet.addRow(['TTFT', avgTTFT, 2000, getStatus(avgTTFT, 2000)]);
    metricsSheet.addRow(['TTFB', avgTTFB, 1000, getStatus(avgTTFB, 1000)]);
    
    // Detail sheet
    const detailSheet = workbook.addWorksheet('Detailed Metrics');
    
    // Headers
    detailSheet.addRow(['Turn', 'STT Latency (ms)', 'LLM Latency (ms)', 'TTS Latency (ms)', 'Total Latency (ms)', 'EOU Delay (ms)', 'TTFT (ms)', 'TTFB (ms)']);
    
    // Data rows
    for (let i = 0; i < this.metrics.turns; i++) {
      detailSheet.addRow([
        i + 1,
        this.metrics.latencies.stt[i] || '-',
        this.metrics.latencies.llm[i] || '-',
        this.metrics.latencies.tts[i] || '-',
        this.metrics.latencies.total[i] || '-',
        this.metrics.delays.eou[i] || '-',
        this.metrics.delays.ttft[i] || '-',
        this.metrics.delays.ttfb[i] || '-'
      ]);
    }
    
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Save the workbook
    const filename = `${logsDir}/session_${this.sessionId}_${Date.now()}.xlsx`;
    await workbook.xlsx.writeFile(filename);
    
    console.log(`Metrics saved to ${filename}`);
    return filename;
  }
}

module.exports = MetricsLogger;
