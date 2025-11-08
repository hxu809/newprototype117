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

    // 调试：检查音频是否可以加载
    console.log('音乐播放器初始化:', musicPlayer);

    musicPlayer.addEventListener('loadeddata', function() {
        console.log('音频文件加载成功');
    });

    musicPlayer.addEventListener('error', function(e) {
        console.error('音频加载错误:', e);
        console.error('错误详情:', musicPlayer.error);
        alert('音频文件加载失败，请确认 "We Don\'t Talk Anymore.mp3" 文件已上传到项目根目录');
    });

    musicPlayer.addEventListener('play', function() {
        console.log('音乐开始播放');
    });

    musicPlayer.addEventListener('pause', function() {
        console.log('音乐暂停');
    });

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
                console.log('碰撞检测：cpntm已放入record player');
                // 隐藏cpntm
                cpntmImg.style.opacity = '0';
                cpntmImg.style.pointerEvents = 'none';
                isCpntmHidden = true;
                isMusicLoaded = true;
                console.log('音乐已加载，可以点击播放器播放音乐');
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
        console.log('点击了record player, isMusicLoaded:', isMusicLoaded);

        if (isMusicLoaded) {
            if (musicPlayer.paused) {
                musicPlayer.play().catch(function(error) {
                    console.error('播放失败:', error);
                    alert('播放失败: ' + error.message);
                });
            } else {
                musicPlayer.pause();
            }
        } else {
            console.log('请先将cpntm图片拖动到record player上');
            alert('请先将cpntm图片拖动到record player上！');
        }
    });

    // 空格键控制播放/暂停
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && isMusicLoaded) {
            e.preventDefault(); // 防止页面滚动
            if (musicPlayer.paused) {
                musicPlayer.play().catch(function(error) {
                    console.error('播放失败:', error);
                });
            } else {
                musicPlayer.pause();
            }
        }

        // ESC键停止播放并弹出cpntm
        if (e.code === 'Escape' && isMusicLoaded) {
            console.log('按下ESC键，弹出cpntm');
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

    console.log('音乐播放器脚本加载完成');
    console.log('使用说明：');
    console.log('1. 拖动cpntm图片到record player上');
    console.log('2. 点击record player播放/暂停音乐');
    console.log('3. 播放时按空格键控制播放/暂停');
    console.log('4. 按ESC键停止并弹出cpntm');
});
