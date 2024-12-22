type LogEntry = {
  startTime: string;
  endTime: string;
  description: string;
  date: string;
}

document.getElementById('save-log')?.addEventListener('click', save_log_entry);
document.addEventListener('DOMContentLoaded', () => { display_logs() });

// =======================================

function save_log_entry(): void {
  const start_time = (document.getElementById('start-time') as HTMLInputElement).value;
  const end_time = (document.getElementById('end-time') as HTMLInputElement).value;
  const description = (document.getElementById('description') as HTMLTextAreaElement).value;
  const today_date = get_today_date();

  if (!start_time || !end_time || start_time >= end_time) {
    alert('Please enter a valid time range.');
    return;
  }

  chrome.storage.local.get(['logs'], (result) => {
    const logs: { [date: string]: LogEntry[] } = result.logs || {};

    if (!logs[today_date]) { logs[today_date] = [] }

    const new_log: LogEntry = {
      startTime: start_time,
      endTime: end_time,
      description: description,
      date: today_date,
    };

    logs[today_date].push(new_log);

    chrome.storage.local.set({ logs: logs }, () => {
      (document.getElementById('start-time') as HTMLInputElement).value = '';
      (document.getElementById('end-time') as HTMLInputElement).value = '';
      (document.getElementById('description') as HTMLTextAreaElement).value = '';
      display_logs();
    });
  });
}

function get_today_date(): string {
  const today = new Date();
  return today
    .toISOString()
    .split('T')[0]; // select first part of ISO string
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
      totalTimeContainer.innerHTML = '<p>Total time: 0m</p>';
      return;
    }

    const total_time = todays_logs.reduce((total, log) => {
      const duration = calculate_duration(log.startTime, log.endTime);
      return total + duration;
    }, 0)
    totalTimeContainer.innerHTML = `<p><strong>Total time today: </strong>${format_duration(total_time)}</p>`;

    todays_logs.forEach((log) => {
      const duration = calculate_duration(log.startTime, log.endTime)
      const log_entry = document.createElement('div');
      log_entry.classList.add('log-entry');
      log_entry.innerHTML = `
        <li>
          <strong>${format_duration(duration)}</strong>
          <small>(${format_into_12hr(log.startTime)}-${format_into_12hr(log.endTime)})</small>: ${log.description}
        </li>
      `;
      logContainer.appendChild(log_entry);
    });
  });
}

function calculate_duration(start_time: string, end_time: string): number {
  const [start_hour, start_minute] = start_time.split(':').map(Number);
  const [end_hour, end_minute] = end_time.split(':').map(Number);

  const start_date = new Date();
  const end_date = new Date();

  start_date.setHours(start_hour, start_minute, 0);
  end_date.setHours(end_hour, end_minute, 0)

  const difference_in_mins = end_date.getTime() - start_date.getTime();
  return Math.max(difference_in_mins / 60000, 0);
}

function format_duration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining_minutes = minutes % 60;
    return `${hours}h ${remaining_minutes}m`;
  }
  return `${minutes}m`;
}

function format_into_12hr(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const am_pm = hour >= 12 ? 'pm' : 'am';
  const adjusted_hour = hour % 12 || 12; // Convert 0 to 12 for midnight

  const padded_hour = adjusted_hour.toString().padStart(2, '0');
  const padded_minute = minute.toString().padStart(2, '0');

  return `${padded_hour}:${padded_minute} ${am_pm}`;
}
