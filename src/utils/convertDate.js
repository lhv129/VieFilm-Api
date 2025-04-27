export function convertDateToTimestamp(dateString) {
  const parts = dateString.split("/");
  if (parts.length !== 3) {
    return null; // Hoặc ném lỗi
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Tháng trong JavaScript bắt đầu từ 0
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  if (isNaN(date.getTime())) {
    return null; // Hoặc ném lỗi
  }

  return date.getTime();
}
