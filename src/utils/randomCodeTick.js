function random(length = 15) {
    //Chưa check mã trùng, vd random ra 1 mã giống trong 2 ticket
    const prefix = "HĐ-";
    return prefix + Math.random().toString(36).substring(2, length + 2).toUpperCase();
}

export const randomCodeTicket = {
    random
}