import { useEffect, useRef, useState } from "react";

const RELOAD_FLAG = "fotober_reloaded_by_leave";

// Điện thoại/tablet: chuyển app, khoá màn hình, xem video toàn màn hình... đều làm trang mất focus
// -> không áp dụng để tránh reload liên tục.
const isTouchDevice = () =>
  /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isEnabled = () =>
  (process.env.NODE_ENV === "production" ||
    process.env.REACT_APP_DEVTOOLS_BLOCK === "true") &&
  !isTouchDevice();

/**
 * Khi khách rời trang (bấm extension, chuyển tab/cửa sổ...):
 *   gọi saveState() để lưu trạng thái đang xem -> reload trang.
 * Sau khi reload, nếu trang chưa được focus -> needsFocus = true (trang hiện thông báo,
 * không render video) cho tới khi khách click lại vào trang.
 *
 * @param {() => void} saveState hàm lưu trạng thái (đồng bộ) trước khi reload
 * @returns {{ needsFocus: boolean, wasReloaded: boolean }}
 */
export function usePageVisibility(saveState) {
  const enabled = isEnabled();
  const [needsFocus, setNeedsFocus] = useState(
    () => enabled && !document.hasFocus()
  );
  const [wasReloaded] = useState(() => {
    try {
      const flag = sessionStorage.getItem(RELOAD_FLAG) === "1";
      sessionStorage.removeItem(RELOAD_FLAG);
      return flag;
    } catch (e) {
      return false;
    }
  });

  const saveRef = useRef(saveState);
  saveRef.current = saveState;
  const needsFocusRef = useRef(needsFocus);
  needsFocusRef.current = needsFocus;

  useEffect(() => {
    if (!enabled) return;
    let leaving = false;

    const handleLeave = () => {
      // Đang chờ khách focus lại (vừa reload) -> không reload nữa, tránh lặp vô hạn
      if (leaving || needsFocusRef.current) return;
      leaving = true;
      try {
        saveRef.current && saveRef.current();
        sessionStorage.setItem(RELOAD_FLAG, "1");
      } catch (e) {
        // sessionStorage bị chặn -> vẫn reload
      }
      window.location.reload();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") handleLeave();
    };

    const handleFocus = () => setNeedsFocus(false);

    window.addEventListener("blur", handleLeave);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pointerdown", handleFocus);

    return () => {
      window.removeEventListener("blur", handleLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pointerdown", handleFocus);
    };
  }, [enabled]);

  return { needsFocus, wasReloaded };
}
