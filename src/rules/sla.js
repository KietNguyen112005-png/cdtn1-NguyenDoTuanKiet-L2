// BR2: hạn cam kết = thời điểm tiếp nhận + số giờ SLA, chỉ tính T2–T7 (bỏ Chủ nhật).
// Giả định ghi trong docs/thay-doi-thiet-ke.md: giờ chạy liên tục 24h/ngày, Chủ nhật không tính.
const HOUR_MS = 3600000;
const DAY_MS = 86400000;

function addWorkingHours(start, hours, tzOffsetMinutes = 420) {
  let local = start.getTime() + tzOffsetMinutes * 60000; // sang "giờ địa phương" để xác định Chủ nhật
  let remaining = hours * HOUR_MS;
  while (remaining > 0) {
    const nextMidnight = (Math.floor(local / DAY_MS) + 1) * DAY_MS;
    if (new Date(local).getUTCDay() === 0) { // Chủ nhật: nhảy tới 00:00 thứ Hai
      local = nextMidnight;
      continue;
    }
    const step = Math.min(remaining, nextMidnight - local);
    local += step;
    remaining -= step;
  }
  return new Date(local - tzOffsetMinutes * 60000);
}

// Ngày địa phương dạng 'YYYY-MM-DD' của một thời điểm, dùng để so sánh bảo hành.
function toLocalDate(instant, tzOffsetMinutes = 420) {
  return new Date(instant.getTime() + tzOffsetMinutes * 60000).toISOString().slice(0, 10);
}

module.exports = { addWorkingHours, toLocalDate };
