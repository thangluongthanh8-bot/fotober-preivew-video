import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { useParams } from 'react-router-dom'; // Import useParams để lấy tham số URL

export function VideoPlayer() {
  const { order_id, video_id } = useParams(); // Lấy order_id và video_id từ URL
  const [videoUrl, setVideoUrl] = useState(null); // State để lưu trữ URL video
  const [orderInfo, setOrderInfo] = useState(null); // State để lưu thông tin đơn hàng
  const [loading, setLoading] = useState(true); // Trạng thái loading
  const [isDevTool, setIsDevTool] = useState(false); // Thêm state để kiểm tra DevTools
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight }); // Trạng thái kích thước cửa sổ
  
  // Lưu kích thước cửa sổ ban đầu khi trang load lần đầu
  const [initialSize, setInitialSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Kiểm tra khi DevTools mở
  function onDevToolsOpen() {
    setIsDevTool(true); // Đánh dấu DevTools đã mở
    setVideoUrl(null);  // Xóa URL video khi DevTools mở
  }

  // Kiểm tra DevTools thông qua đối tượng console
  useEffect(() => {
    const devtoolsDetection = () => {
      const devtools = /./;
      devtools.toString = function () {
        onDevToolsOpen(); // Khi DevTools mở, gọi hàm này
      };
      console.log(devtools); // Thực thi để kích hoạt việc kiểm tra
    };

    devtoolsDetection(); // Kiểm tra DevTools khi component được mount

    // Dọn dẹp khi cần
    return () => {
      clearTimeout();
    };
  }, []);

  // Kiểm tra thay đổi kích thước cửa sổ so với kích thước ban đầu
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });

      // So sánh kích thước mới với kích thước ban đầu
      if (
        Math.abs(window.innerWidth - initialSize.width) > 50 || // So sánh nếu kích thước thay đổi lớn hơn 50px
        Math.abs(window.innerHeight - initialSize.height) > 50
      ) {
        onDevToolsOpen(); // Nếu thay đổi kích thước quá lớn, xác định DevTools đã mở
      }
    };

    // Lắng nghe sự kiện thay đổi kích thước cửa sổ
    window.addEventListener('resize', handleResize);

    // Dọn dẹp khi component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [initialSize]); // Chạy lại khi kích thước cửa sổ thay đổi

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
          console.error('Error fetching video:', error);
          setLoading(false); // Đảm bảo không bị treo trong trường hợp lỗi
        }
      };
      fetchVideo();
    } else {
      setLoading(false); // Nếu DevTools mở thì không cần loading
    }
  }, [order_id, video_id, isDevTool]); // Gọi lại mỗi khi order_id, video_id hoặc isDevTool thay đổi

  // Nếu DevTools mở, block hoàn toàn trang và xóa video
  if (isDevTool) {
    return <h1 style={{ color: 'red', textAlign: 'center' }}>DevTools is open. Access is blocked.</h1>;
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
