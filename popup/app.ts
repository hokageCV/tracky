export type LogEntry = {
  startTime: string;
  endTime: string;
  description: string;
  date: string;
  tag?: string;
}

document.getElementById('save-log')?.addEventListener('click', save_log_entry);
document.addEventListener('DOMContentLoaded', () => {
  display_logs()
  populate_tags_list()
});
document.addEventListener('DOMContentLoaded', () => {
  const viewByTagsButton = document.getElementById('view-by-tags-btn') as HTMLButtonElement;
  if (viewByTagsButton) {
    viewByTagsButton.addEventListener('click', () => {
      window.location.href = './grouped_by_tag/index.html';
    });
  }
});

// =======================================

function save_log_entry(): void {
  const start_time = (document.getElementById('start-time') as HTMLInputElement).value;
  const end_time = (document.getElementById('end-time') as HTMLInputElement).value;
  const description = (document.getElementById('description') as HTMLTextAreaElement).value;
  const tag = (document.getElementById('tags') as HTMLInputElement).value;
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
      tag,
    };

    logs[today_date].push(new_log);

    chrome.storage.local.set({ logs: logs }, () => {
      (document.getElementById('start-time') as HTMLInputElement).value = '';
      (document.getElementById('end-time') as HTMLInputElement).value = '';
      (document.getElementById('description') as HTMLTextAreaElement).value = '';
      (document.getElementById('tags') as HTMLInputElement).value = '';
      display_logs();
    });
  });
}

function get_today_date(offset: number = 0): string {
  const today = new Date();
  today.setDate(today.getDate() + offset);
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

    todays_logs.forEach((log, index) => {
      const duration = calculate_duration(log.startTime, log.endTime)
      const log_entry = document.createElement('div');
      log_entry.classList.add('log-entry');
      log_entry.innerHTML = `
        <li>
          <strong>${format_duration(duration)}</strong>
          <small>(${format_into_12hr(log.startTime)}-${format_into_12hr(log.endTime)})</small>: ${log.description}
          <button class="edit-btn log-action-btn" data-index="${index}">\u{270E}</button>
          <button class="delete-btn log-action-btn" data-index="${index}">\u{1F5D1}️</button>
        </li>
      `;
      logContainer.appendChild(log_entry);

      const deleteButton = log_entry.querySelector('.delete-btn');
      if (deleteButton) {
        deleteButton.addEventListener('click', () => {
          delete_log(index, today_date);
        });
      }

      const editButton = log_entry.querySelector('.edit-btn');
      if (editButton) {
        editButton.addEventListener('click', () => {
          edit_log(index, log, today_date);
        });
      }
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
  const an_hour = 60;

  if (minutes >= an_hour) {
    const hours = Math.floor(minutes / an_hour);
    const remaining_minutes = Math.round(minutes % an_hour);

    if (remaining_minutes === an_hour) return `${hours + 1}h`;

    return `${hours}h ${remaining_minutes}m`;
  }
  return `${Math.round(minutes)}m`;
}

function format_into_12hr(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const am_pm = hour >= 12 ? 'pm' : 'am';
  const adjusted_hour = hour % 12 || 12; // Convert 0 to 12 for midnight

  const padded_hour = adjusted_hour.toString().padStart(2, '0');
  const padded_minute = minute.toString().padStart(2, '0');

  return `${padded_hour}:${padded_minute} ${am_pm}`;
}

function delete_log(index: number, date: string) {
  chrome.storage.local.get(['logs'], (result) => {
    const logs: { [date: string]: LogEntry[] } = result.logs || {};
    const todays_logs = logs[date] || [];

    todays_logs.splice(index, 1);

    if (todays_logs.length === 0) {
      delete logs[date];
    } else {
      logs[date] = todays_logs;
    }

    chrome.storage.local.set({ logs }, () => {
      display_logs();
    });
  });
}

function edit_log(index: number, log: LogEntry, date: string): void {
  const logContainer = document.getElementById('log-container') as HTMLDivElement;
  logContainer.innerHTML = '';

  const editForm = document.createElement('div');
  editForm.classList.add('edit-form');
  editForm.innerHTML = `
    <h3>Edit Log</h3>
    <form id='time-input-form'>
      <label for='edit-start-time'>
        Start Time:
        <input type='time' id='edit-start-time' class='input-field' value=${log.startTime} />
      </label>
      <label for='edit-end-time'>
        End Time:
        <input type='time' id='edit-end-time' class='input-field' value=${log.endTime} />
      </label>
      <textarea id='edit-description' class='input-field'>${log.description}</textarea>
      <input type='text' id='edit-tags' class='input-field' value=${log?.tag || ''}>
      <button id="save-edit-btn">Save</button>
      <button id="cancel-edit-btn">Cancel</button>
    </form>
  `

  logContainer.appendChild(editForm);

  const saveButton = document.getElementById('save-edit-btn') as HTMLButtonElement;
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const newStartTime = (document.getElementById('edit-start-time') as HTMLInputElement).value;
      const newEndTime = (document.getElementById('edit-end-time') as HTMLInputElement).value;
      const newDescription = (document.getElementById('edit-description') as HTMLTextAreaElement).value;
      const newTag = (document.getElementById('edit-tags') as HTMLInputElement).value;

      const updatedLog: LogEntry = {
        startTime: newStartTime,
        endTime: newEndTime,
        description: newDescription,
        date: log.date,
        tag: newTag,
      };

      update_log(index, updatedLog, date);
    });
  }

  const cancelButton = document.getElementById('cancel-edit-btn') as HTMLButtonElement;
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      display_logs();
    });
  }
}

function update_log(index: number, updatedLog: LogEntry, date: string): void {
  chrome.storage.local.get(['logs'], (result) => {
    const logs: { [date: string]: LogEntry[] } = result.logs || {};
    const todays_logs = logs[date] || [];

    todays_logs[index] = updatedLog;
    logs[date] = todays_logs;

    chrome.storage.local.set({ logs }, () => {
      display_logs();
    });
  });
}

function populate_tags_list(): void {
  const today_date = get_today_date();
  const yesterday_date = get_today_date(-1);

  chrome.storage.local.get(['logs'], (result) => {
    const logs: { [date: string]: LogEntry[] } = result.logs || {};
    const todays_logs: LogEntry[] = logs[today_date] || [];
    const yesterdays_logs = logs[yesterday_date] || [];

    const unique_tags = new Set<string>();
    [...todays_logs, ...yesterdays_logs].forEach((log) => {
      if (log.tag) unique_tags.add(log.tag);
    });

    const datalist = document.getElementById('tags-list') as HTMLDataListElement;
    datalist.innerHTML = '';

    unique_tags.forEach((tag) => {
      const option = document.createElement('option');
      option.value = tag;
      datalist.appendChild(option);
    });
  });
}
