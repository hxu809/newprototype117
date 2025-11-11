// 拖动功能实现
document.addEventListener('DOMContentLoaded', function() {
    const cpntmImg = document.querySelector('.cpntm-img');
    const weekndImg = document.querySelector('.weeknd-img');
    const recordPlayerImg = document.querySelector('.record-player-img');
    const musicPlayer = document.getElementById('music-player');

    // 为每个可拖拽元素创建拖拽状态
    const dragStates = {
        cpntm: {
            element: cpntmImg,
            isDragging: false,
            currentX: 0,
            currentY: 0,
            initialX: 0,
            initialY: 0,
            xOffset: 0,
            yOffset: 0,
            isHidden: false
        },
        weeknd: {
            element: weekndImg,
            isDragging: false,
            currentX: 0,
            currentY: 0,
            initialX: 0,
            initialY: 0,
            xOffset: 0,
            yOffset: 0,
            isHidden: false
        }
    };

    let isMusicLoaded = false; // 跟踪音乐是否已加载到唱片机
    let currentDraggingKey = null; // 当前正在拖拽的元素key

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

    // 为每个可拖拽元素添加事件监听
    function setupDraggable(key, element) {
        if (!element) {
            console.warn(`元素 ${key} 未找到，跳过拖拽设置`);
            return;
        }

        element.addEventListener('mousedown', function(e) {
            dragStart(e, key);
        });
        element.addEventListener('touchstart', function(e) {
            dragStart(e, key);
        });

        // 添加过渡效果
        element.style.transition = 'opacity 0.3s ease';
    }

    setupDraggable('cpntm', cpntmImg);
    setupDraggable('weeknd', weekndImg);

    // 全局事件监听
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', dragEnd);

    function dragStart(e, key) {
        const state = dragStates[key];
        if (!state || state.isHidden) return;

        if (e.type === 'touchstart') {
            state.initialX = e.touches[0].clientX - state.xOffset;
            state.initialY = e.touches[0].clientY - state.yOffset;
        } else {
            state.initialX = e.clientX - state.xOffset;
            state.initialY = e.clientY - state.yOffset;
        }

        state.isDragging = true;
        currentDraggingKey = key;
        console.log(`开始拖动: ${key}`);
    }

    function drag(e) {
        if (!currentDraggingKey) return;

        const state = dragStates[currentDraggingKey];
        if (!state.isDragging) return;

        e.preventDefault();

        if (e.type === 'touchmove') {
            state.currentX = e.touches[0].clientX - state.initialX;
            state.currentY = e.touches[0].clientY - state.initialY;
        } else {
            state.currentX = e.clientX - state.initialX;
            state.currentY = e.clientY - state.initialY;
        }

        state.xOffset = state.currentX;
        state.yOffset = state.currentY;

        setTranslate(state.currentX, state.currentY, state.element);
    }

    function dragEnd(e) {
        if (!currentDraggingKey) return;

        const state = dragStates[currentDraggingKey];
        if (!state.isDragging) return;

        state.initialX = state.currentX;
        state.initialY = state.currentY;
        state.isDragging = false;

        // 检测碰撞
        if (checkCollision(state.element, recordPlayerImg)) {
            console.log(`碰撞检测：${currentDraggingKey} 已放入 record player`);
            // 隐藏图片
            state.element.style.opacity = '0';
            state.element.style.pointerEvents = 'none';
            state.isHidden = true;
            isMusicLoaded = true;
            console.log('音乐已加载，可以点击播放器播放音乐');
        }

        currentDraggingKey = null;
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
            console.log('请先将cpntm或weeknd图片拖动到record player上');
            alert('请先将cpntm或weeknd图片拖动到record player上！');
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

        // ESC键停止播放并弹出所有隐藏的图片
        if (e.code === 'Escape' && isMusicLoaded) {
            console.log('按下ESC键，弹出所有图片');
            musicPlayer.pause();
            musicPlayer.currentTime = 0; // 重置到开始

            // 显示所有隐藏的图片
            Object.keys(dragStates).forEach(function(key) {
                const state = dragStates[key];
                if (state.isHidden) {
                    state.element.style.opacity = '1';
                    state.element.style.pointerEvents = 'auto';
                    state.isHidden = false;
                }
            });

            isMusicLoaded = false;
        }
    });

    console.log('音乐播放器脚本加载完成');
    console.log('使用说明：');
    console.log('1. 拖动cpntm或weeknd图片到record player上');
    console.log('2. 点击record player播放/暂停音乐');
    console.log('3. 播放时按空格键控制播放/暂停');
    console.log('4. 按ESC键停止并弹出所有图片');
});
