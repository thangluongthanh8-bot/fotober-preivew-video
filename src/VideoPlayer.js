import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom'; // Import useParams để lấy tham số URL

// Link chia sẻ Dropbox (dl=0/dl=1) trả về trang HTML; chỉ Chrome mới tự được redirect sang file.
// iOS Safari cần link file trực tiếp (raw=1) hỗ trợ Range request mới phát được video.
const toDirectVideoUrl = (link) => {
  if (!link) return link;
  try {
    const url = new URL(link);
    if (/(^|\.)dropbox\.com$/i.test(url.hostname)) {
      url.searchParams.delete('dl');
      url.searchParams.set('raw', '1');
      return url.toString();
    }
  } catch (e) {
    // URL không hợp lệ, giữ nguyên
  }
  return link;
};

export function VideoPlayer() {
  let isDevTool = false;
  const { order_id, video_id } = useParams(); // Lấy order_id và video_id từ URL
  const [videoUrl, setVideoUrl] = useState(null); // State để lưu trữ URL video
  const [orderInfo, setOrderInfo] = useState(null); // State để lưu thông tin đơn hàng
  const [loading, setLoading] = useState(true); // Trạng thái loading
  const [errorMsg, setErrorMsg] = useState(null); // State để lưu thông báo lỗi

  useEffect(() => {
    if (order_id && video_id && !isDevTool) {
      const fetchVideo = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/get-video?order_id=${order_id}&video_id=${video_id}`);
          const text = await response.text(); // Lấy phản hồi dưới dạng văn bản

          let data;
          try {
            data = JSON.parse(text);
          } catch (e) {
            throw new Error('Invalid JSON response');
          }

          if (!response.ok || data.status === 'error' || !data.data) {
            setErrorMsg(data.message || 'No video data found.');
            setLoading(false);
            return;
          }

          setVideoUrl(toDirectVideoUrl(data.data.link)); // Lưu URL video (link trực tiếp để iOS Safari phát được)
          setOrderInfo(data.data.order); // Lưu thông tin đơn hàng
          setLoading(false);
        } catch (error) {
          setErrorMsg('Failed to load video data.');
          setLoading(false); // Đảm bảo không bị treo trong trường hợp lỗi
        }
      };
      fetchVideo();
    } else {
      setLoading(false); // Nếu DevTools mở thì không cần loading
    }
  }, [order_id, video_id, isDevTool]);

  if (loading) {
    return <div>Loading video...</div>; // Hiển thị trạng thái loading
  } else if (errorMsg || !videoUrl) {
    return <div>{errorMsg || 'No video data found.'}</div>; // Hiển thị thông báo lỗi hoặc không tìm thấy
  }

  return (
    <div className="video-wrapper">
      <ReactPlayer
        url={videoUrl} // Sử dụng URL video từ API
        className="react-player"
        controls={true}
        playsinline={true}
        config={{
          file: {
            attributes: {
              preload: 'metadata',
              controlsList: 'nodownload',
              onContextMenu: e => e.preventDefault(),
            }
          }
        }}
      />
      <div className="order-info">
        <h3>Order Information</h3>
        <p><strong>Name:</strong> {orderInfo.name}</p>
        <p><strong>Code:</strong> {orderInfo.code}</p>
        <p><strong>Notes:</strong> {orderInfo.notes}</p>
      </div>
    </div>
  );
}
