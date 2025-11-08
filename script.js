// 拖动功能实现
document.addEventListener('DOMContentLoaded', function() {
    const cpntmImg = document.querySelector('.cpntm-img');
    const recordPlayerImg = document.querySelector('.record-player-img');
    const musicPlayer = document.getElementById('music-player');

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    let isCpntmHidden = false; // 跟踪cpntm是否被隐藏
    let isMusicLoaded = false; // 跟踪音乐是否已加载到唱片机

    // 鼠标按下事件
    cpntmImg.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    // 触摸事件（移动设备）
    cpntmImg.addEventListener('touchstart', dragStart);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);

    function dragStart(e) {
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === cpntmImg) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, cpntmImg);
        }
    }

    function dragEnd(e) {
        if (isDragging) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;

            // 检测碰撞
            if (checkCollision(cpntmImg, recordPlayerImg)) {
                // 隐藏cpntm
                cpntmImg.style.opacity = '0';
                cpntmImg.style.pointerEvents = 'none';
                isCpntmHidden = true;
                isMusicLoaded = true;
            }
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    // 碰撞检测函数
    function checkCollision(elem1, elem2) {
        const rect1 = elem1.getBoundingClientRect();
        const rect2 = elem2.getBoundingClientRect();

        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
        );
    }

    // 点击record player播放音乐
    recordPlayerImg.addEventListener('click', function() {
        if (isMusicLoaded) {
            if (musicPlayer.paused) {
                musicPlayer.play();
            } else {
                musicPlayer.pause();
            }
        }
    });

    // 空格键控制播放/暂停
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && isMusicLoaded) {
            e.preventDefault(); // 防止页面滚动
            if (musicPlayer.paused) {
                musicPlayer.play();
            } else {
                musicPlayer.pause();
            }
        }

        // ESC键停止播放并弹出cpntm
        if (e.code === 'Escape' && isMusicLoaded) {
            musicPlayer.pause();
            musicPlayer.currentTime = 0; // 重置到开始

            // 显示cpntm
            cpntmImg.style.opacity = '1';
            cpntmImg.style.pointerEvents = 'auto';
            isCpntmHidden = false;
            isMusicLoaded = false;
        }
    });

    // 添加过渡效果到cpntm
    cpntmImg.style.transition = 'opacity 0.3s ease';
});
