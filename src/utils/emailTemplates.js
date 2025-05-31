export const buildTicketEmailHTML = (ticket) => {
    const { code, movie, cinema, showtime, screen, details, totalAmount } = ticket;
    const { seats = [], products = [] } = details || {};

    return `
  <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:8px;">
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px dashed #ccc;">
      <div>
        <p style="font-size:12px;color:#555;margin:0;">Mã đặt vé</p>
        <p style="font-size:20px;color:#2563eb;font-weight:bold;margin:4px 0;">${code}</p>
        <p style="font-size:12px;color:#999;">Đưa mã này cho nhân viên soát vé để nhận vé vào rạp</p>
      </div>
      <img src="https://res.cloudinary.com/dewhibspm/image/upload/v1748697296/logo_mxirzt.png" alt="Logo" width="50" height="50"/>
    </div>

    <div style="padding:16px 0;border-bottom:1px dashed #ccc;">
      <h2 style="margin:0 0 8px 0;font-size:18px;">${movie?.title}</h2>
      <p style="margin:0 0 8px 0;color:#666;">${cinema?.name}</p>
      <table style="width:100%;font-size:14px;color:#333;margin-bottom:8px;">
        <tr>
          <td style="padding:4px 0;"><strong>Ngày chiếu:</strong></td>
          <td style="padding:4px 0;">${showtime?.date}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Thời gian:</strong></td>
          <td style="padding:4px 0;">${showtime?.startTime}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;"><strong>Phòng chiếu:</strong></td>
          <td style="padding:4px 0;">${screen?.name}</td>
        </tr>
      </table>
      <div style="margin-top:8px;">
        <strong>Ghế đã đặt:</strong> ${seats.map(s => s.seatCode).join(", ")}
      </div>
    </div>

    <div style="padding:16px 0;border-bottom:1px dashed #ccc;">
      <strong>Thông tin rạp:</strong><br/>
      ${cinema?.name}<br/>
      <span style="color:#666;">${cinema?.address}</span>
    </div>

    ${products.length > 0
            ? `<div style="padding:16px 0;border-bottom:1px dashed #ccc;">
            <strong>Sản phẩm đi kèm:</strong>
            <ul style="padding-left:16px;margin:8px 0;color:#333;">
              ${products.map(
                (p) => `<li>${p.name} (x${p.quantity}): <strong>${(p.price * p.quantity).toLocaleString()}đ</strong></li>`
            ).join("")}
            </ul>
          </div>`
            : ""
        }

    <div style="padding-top:16px;font-size:16px;font-weight:bold;text-align:right;">
      Tổng tiền: ${totalAmount?.toLocaleString()}đ
    </div>
  </div>
  `;
};
