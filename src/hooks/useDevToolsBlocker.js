import { useEffect, useState } from "react";

// Điện thoại/tablet không có DevTools; bỏ qua để tránh chặn nhầm khi xoay màn hình,
// thanh địa chỉ thu gọn, bàn phím ảo...
const isTouchDevice = () =>
  /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const SIZE_THRESHOLD = 160;
const CHECK_INTERVAL = 1000;
const DEBUGGER_THRESHOLD = 100; // ms

/**
 * Phát hiện DevTools (desktop) và trả về { isDevToolOpen }.
 * - Docked DevTools: chênh lệch outer/inner size của cửa sổ.
 * - Mọi kiểu DevTools (kể cả undocked, mở sẵn từ trang khác): `debugger` làm trang dừng lại -> đo thời gian.
 * (Không dùng mẹo console.log(Error có getter `message`): nó báo nhầm khi có extension/công cụ
 *  kết nối qua Chrome DevTools Protocol dù DevTools không mở.)
 * Khi DevTools đóng lại sau khi đã bị phát hiện -> reload trang.
 */
export function useDevToolsBlocker() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const enabled =
      process.env.NODE_ENV === "production" ||
      process.env.REACT_APP_DEVTOOLS_BLOCK === "true"; // bật thử khi chạy dev
    if (!enabled || isTouchDevice()) return;

    // Build production (terser) xoá câu lệnh `debugger`, nên tạo bằng Function.
    // eslint-disable-next-line no-new-func
    const pause = new Function("debugger");

    let wasOpen = false;

    const check = () => {
      const sizeOpen =
        window.outerWidth - window.innerWidth > SIZE_THRESHOLD ||
        window.outerHeight - window.innerHeight > SIZE_THRESHOLD;
      // `debugger` chỉ dừng khi DevTools mở (kể cả undocked, mở sẵn từ trang khác)
      const start = performance.now();
      pause();
      const debuggerOpen = performance.now() - start > DEBUGGER_THRESHOLD;

      const open = sizeOpen || debuggerOpen;

      if (open && !wasOpen) {
        wasOpen = true;
        sessionStorage.clear();
        setIsOpen(true);
      } else if (!open && wasOpen) {
        window.location.reload();
      }
    };

    check();
    const timer = setInterval(check, CHECK_INTERVAL);
    window.addEventListener("resize", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", check);
    };
  }, []);

  return { isDevToolOpen: isOpen };
}
