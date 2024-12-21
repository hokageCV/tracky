type LogEntry = {
  timeSpent: number;
  description: string;
  date: string;
}

function get_today_date(): string {
  const today = new Date();
  return today
    .toISOString()
    .split('T')[0]; // select first part of ISO string
}

function save_log_entry(): void {
  const time_spent_in_minutes = parseFloat((document.getElementById('time-spent') as HTMLInputElement).value);
  const description = (document.getElementById('description') as HTMLTextAreaElement).value;
  const today_date = get_today_date();

  if (isNaN(time_spent_in_minutes) || time_spent_in_minutes <= 0) {
    alert('Enter valid time in mins');
    return;
  }

  chrome.storage.local.get(['logs'], (result) => {
    const logs: { [date: string]: LogEntry[] } = result.logs || {};

    if (!logs[today_date]) { logs[today_date] = [] }

    const new_log: LogEntry = {
      timeSpent: time_spent_in_minutes,
      description: description,
      date: today_date,
    };

    logs[today_date].push(new_log);

    chrome.storage.local.set({ logs: logs }, () => {
      (document.getElementById('time-spent') as HTMLInputElement).value = '';
      (document.getElementById('description') as HTMLTextAreaElement).value = '';
      display_logs();
    });
  });
}

function calculate_total_time(todays_logs: LogEntry[]): number {
  return todays_logs.reduce((total, log) => total + log.timeSpent, 0);
}

function display_logs(): void {
  const today_date = get_today_date();

  chrome.storage.local.get(['logs'], (result) => {
    const logs: { [date: string]: LogEntry[] } = result.logs || {};
    const todays_logs = logs[today_date] || [];

    const logContainer = document.getElementById('log-container') as HTMLUListElement;
    logContainer.innerHTML = '';

    const totalTimeContainer = document.getElementById('total-time') as HTMLDivElement;
    totalTimeContainer.innerHTML = '';

    if (todays_logs.length === 0) {
      logContainer.innerHTML = '<p>No tracked time</p>';
      totalTimeContainer.innerHTML = '<p>Total time: 0 minutes</p>';
      return;
    }

    const total_ime = calculate_total_time(todays_logs);
    totalTimeContainer.innerHTML = `<p><strong>Total time today: </strong>${total_ime} minutes</p>`;

    todays_logs.forEach((log) => {
      const log_entry = document.createElement('div');
      log_entry.classList.add('log-entry');
      log_entry.innerHTML = `
        <li><strong>${log.timeSpent} mins:</strong> ${log.description}</li>
      `;
      logContainer.appendChild(log_entry);
    });
  });
}

document.getElementById('save-log')?.addEventListener('click', save_log_entry);
document.addEventListener('DOMContentLoaded', () => { display_logs() });
