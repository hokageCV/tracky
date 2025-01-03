import { LogEntry } from '../app';

document.addEventListener('DOMContentLoaded', () => {
  display_logs_grouped_by_tag();

  const backButton = document.getElementById('back-btn') as HTMLButtonElement;
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = '../index.html';
    });
  }
});

function display_logs_grouped_by_tag(): void {
  const today_date = get_today_date();

  chrome.storage.local.get(['logs'], (result) => {
    const logs: { [date: string]: LogEntry[] } = result.logs || {};
    const all_logs: LogEntry[] = logs[today_date] || [];

    const logs_by_tag: { [tag: string]: LogEntry[] } = {};

    all_logs.forEach((log) => {
      const tag = log.tag || 'untagged';
      if (!logs_by_tag[tag]) {
        logs_by_tag[tag] = [];
      }
      logs_by_tag[tag].push(log);
    });

    const tagsListContainer = document.getElementById('tags-log-container') as HTMLDivElement;
    tagsListContainer.innerHTML = '';

    for (const [tag, logs_with_tag] of Object.entries(logs_by_tag)) {
      const total_tag_time = logs_with_tag.reduce((total, log) => {
        return total + calculate_duration(log.startTime, log.endTime);
      }, 0);

      const tagSection = document.createElement('div');
      tagSection.classList.add('tag-group');
      tagSection.innerHTML = `<p>${tag === 'untagged' ? 'Untagged' : tag} - ${format_duration(total_tag_time)}</p>`;

      const log_list = document.createElement('ul');
      logs_with_tag.forEach((log) => {
        const logItem = document.createElement('li');
        logItem.innerHTML = `${format_into_12Hr(log.startTime)} - ${format_into_12Hr(log.endTime)}: ${log.description}`;
        log_list.appendChild(logItem);
      });

      tagSection.appendChild(log_list);
      tagsListContainer.appendChild(tagSection);
    }
  });
}

// ==============================================
// Duplicating functions from popup.ts. On importing them, errors are coming.
// grouped_by_tag.html runs. Error comes in popup.js

function format_into_12Hr(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function format_duration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remaining_minutes = minutes % 60;
    return `${hours}h ${remaining_minutes}m`;
  }
  return `${minutes}m`;
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

function get_today_date(): string {
  const today = new Date();
  return today
    .toISOString()
    .split('T')[0]; // select first part of ISO string
}
