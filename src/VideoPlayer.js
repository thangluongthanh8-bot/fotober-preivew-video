import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom'; // Import useParams để lấy tham số URL

export function VideoPlayer() {
  const { order_id, video_id } = useParams(); // Lấy order_id và video_id từ URL
  const [videoUrl, setVideoUrl] = useState(null); // State để lưu trữ URL video
  const [orderInfo, setOrderInfo] = useState(null); // State để lưu thông tin đơn hàng
  const [loading, setLoading] = useState(true); // Trạng thái loading
  const [isDevTool, setIsDevTool] = useState(false); // Thêm state để kiểm tra DevTools

  // Kiểm tra DevTools khi kích thước cửa sổ thay đổi
  useEffect(() => {
    let initialWidth = window.innerWidth; // Lấy độ rộng ban đầu của cửa sổ
    let initialHeight = window.innerHeight; // Lấy độ cao ban đầu của cửa sổ
    let checkTimeout;

    const checkDevTools = () => {
      // Kiểm tra xem cửa sổ đã thay đổi đáng kể không
      if (
        (window.innerWidth < initialWidth - 20) || // Nếu độ rộng giảm hơn 20px
        (window.innerHeight < initialHeight - 20) // Nếu độ cao giảm hơn 20px
      ) {
        setIsDevTool(true); // Nếu phát hiện thay đổi lớn, đánh dấu DevTools đã mở
        clearTimeout(checkTimeout); // Dừng kiểm tra nữa
      }
    };

    // Kiểm tra khi cửa sổ thay đổi kích thước
    window.addEventListener('resize', checkDevTools);

    // Clean up khi component unmount hoặc khi đã phát hiện DevTools mở
    return () => {
      window.removeEventListener('resize', checkDevTools);
      clearTimeout(checkTimeout); // Dọn dẹp timeout
    };
  }, []);

  useEffect(() => {
    if (order_id && video_id && !isDevTool) {
      const fetchVideo = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/get-video?order_id=${order_id}&video_id=${video_id}`);
          const text = await response.text(); // Lấy phản hồi dưới dạng văn bản
          
          const data = JSON.parse(text); // Chuyển đổi văn bản thành JSON
          
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          
          setVideoUrl(data.data.link); // Lưu URL video
          setOrderInfo(data.data.order); // Lưu thông tin đơn hàng
          setLoading(false); // Nếu DevTools mở thì không cần loading
        } catch (error) {
          // console.error('Error fetching video:', error);
        }
      };
      fetchVideo();
    } else {
      setLoading(false); // Nếu DevTools mở thì không cần loading
    }
  }, [order_id, video_id, isDevTool]); // Gọi lại mỗi khi order_id, video_id hoặc isDevTool thay đổi

  if (isDevTool) {
    return <h1>DevTools is open. Access is blocked.</h1>; // Hiển thị khi DevTools mở
  }

  if (loading) {
    return <div>Loading video...</div>; // Hiển thị trạng thái loading
  } else if (!videoUrl) {
    return <div>No video data found.</div>; // Nếu không có dữ liệu video
  }

  return (
    <div className="video-wrapper">
      <ReactPlayer
        url={videoUrl} // Sử dụng URL video từ API
        className="react-player"
        controls={true}
        config={{
          file: {
            attributes: {
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
