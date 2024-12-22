import { LogEntry } from '../popup';

document.addEventListener('DOMContentLoaded', () => {
  display_logs_grouped_by_tag();

  const backButton = document.getElementById('back-btn') as HTMLButtonElement;
  if (backButton) {
    backButton.addEventListener('click', () => {
      window.location.href = '../popup.html';
    });
  }
});

function display_logs_grouped_by_tag(): void {
  chrome.storage.local.get(['logs'], (result) => {
    const logs: { [date: string]: LogEntry[] } = result.logs || {};
    const all_logs: LogEntry[] = Object.values(logs).flat();

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

    for (const [tag, logsWithTag] of Object.entries(logs_by_tag)) {
      const tagSection = document.createElement('div');
      tagSection.classList.add('tag-group');
      tagSection.innerHTML = `<h4>${tag === 'untagged' ? 'Untagged' : tag}</h4>`;

      const log_list = document.createElement('ul');
      logsWithTag.forEach((log) => {
        const logItem = document.createElement('li');
        logItem.innerHTML = `${format_into_12Hr(log.startTime)} - ${format_into_12Hr(log.endTime)}: ${log.description}`;
        log_list.appendChild(logItem);
      });

      tagSection.appendChild(log_list);
      tagsListContainer.appendChild(tagSection);
    }
  });
}

function format_into_12Hr(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
