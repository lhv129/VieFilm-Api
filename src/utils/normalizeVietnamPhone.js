export function normalizeVietnamPhone(phone) {
    if (!phone) return "";

    // Xóa khoảng trắng và dấu gạch ngang
    phone = phone.replace(/[\s\-]/g, '');

    if (phone.startsWith("+84")) {
        return "0" + phone.slice(3);
    }

    if (phone.startsWith("84")) {
        return "0" + phone.slice(2);
    }

    return phone;
}