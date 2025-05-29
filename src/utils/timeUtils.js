// src/utils/timeUtils.js

// Tạo danh sách các khung giờ có thể bắt đầu chiếu
const generatePossibleStartTimes = (start = "08:00", end = "23:00") => {
    const result = [];
    let [h, m] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);

    while (h < endH || (h === endH && m <= endM)) {
        result.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
        m += 5;
        if (m >= 60) {
            m -= 60;
            h += 1;
        }
    }

    return result;
};

// Chuyển chuỗi "HH:mm" sang tổng số phút
const timeToMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

// Hàm chuyển phút sang "HH:mm"
function minutesToTimeRounded(minutes) {
    const rounded = roundUpToNearestFive(minutes);
    const hrs = Math.floor(rounded / 60);
    const mins = rounded % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function roundUpToNearestFive(minutes) {
    return Math.ceil(minutes / 5) * 5;
}

// Kiểm tra xem một thời điểm có xung đột với các suất chiếu khác không
const isConflict = (startTime, existingShowtimes, duration, buffer) => {
    const start = timeToMinutes(startTime);
    const end = start + duration;

    for (const st of existingShowtimes) {
        const stStart = timeToMinutes(st.startTime);
        const stEnd = timeToMinutes(st.endTime);
        if (start < stEnd + buffer && end + buffer > stStart) {
            return true;
        }
    }

    return false;
};

export const timeUtils = { generatePossibleStartTimes, timeToMinutes, isConflict, minutesToTimeRounded }
