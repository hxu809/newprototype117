// 拖动功能实现 - 支持多个图片关联不同音乐
document.addEventListener('DOMContentLoaded', function() {
    const cpntmImg = document.querySelector('.cpntm-img');
    const weekndImg = document.querySelector('.weeknd-img');
    const recordPlayerImg = document.querySelector('.record-player-img');
    const cpntmMusicPlayer = document.getElementById('music-player-cpntm');
    const weekndMusicPlayer = document.getElementById('music-player-weeknd');

    // 为每个可拖拽元素创建拖拽状态，并关联对应的音乐播放器
    const dragStates = {
        cpntm: {
            element: cpntmImg,
            musicPlayer: cpntmMusicPlayer,
            musicName: 'We Don\'t Talk Anymore',
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
            musicPlayer: weekndMusicPlayer,
            musicName: 'After Hours',
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

    let currentLoadedMusic = null; // 当前加载的音乐类型 ('cpntm' 或 'weeknd')
    let currentDraggingKey = null; // 当前正在拖拽的元素key

    // 调试：检查音频是否可以加载
    console.log('音乐播放器初始化:');
    console.log('  - cpntm音乐播放器:', cpntmMusicPlayer);
    console.log('  - weeknd音乐播放器:', weekndMusicPlayer);

    // 为每个音乐播放器添加事件监听
    function setupMusicPlayer(key, player, musicName) {
        if (!player) {
            console.warn(`音乐播放器 ${key} 未找到`);
            return;
        }

        player.addEventListener('loadeddata', function() {
            console.log(`${musicName} 音频文件加载成功`);
        });

        player.addEventListener('error', function(e) {
            console.error(`${musicName} 音频加载错误:`, e);
            console.error('错误详情:', player.error);
        });

        player.addEventListener('play', function() {
            console.log(`${musicName} 开始播放`);
        });

        player.addEventListener('pause', function() {
            console.log(`${musicName} 暂停`);
        });
    }

    setupMusicPlayer('cpntm', cpntmMusicPlayer, 'We Don\'t Talk Anymore');
    setupMusicPlayer('weeknd', weekndMusicPlayer, 'After Hours');

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

            // 停止当前正在播放的音乐
            if (currentLoadedMusic && dragStates[currentLoadedMusic]) {
                const prevState = dragStates[currentLoadedMusic];
                if (prevState.musicPlayer) {
                    prevState.musicPlayer.pause();
                    prevState.musicPlayer.currentTime = 0;
                }
                // 如果之前有加载的图片，也弹出它
                if (prevState.isHidden) {
                    prevState.element.style.opacity = '1';
                    prevState.element.style.pointerEvents = 'auto';
                    prevState.isHidden = false;
                }
            }

            // 隐藏当前拖入的图片
            state.element.style.opacity = '0';
            state.element.style.pointerEvents = 'none';
            state.isHidden = true;

            // 设置当前加载的音乐
            currentLoadedMusic = currentDraggingKey;
            console.log(`${state.musicName} 已加载，可以点击播放器播放音乐`);
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
        console.log('点击了record player, currentLoadedMusic:', currentLoadedMusic);

        if (currentLoadedMusic && dragStates[currentLoadedMusic]) {
            const state = dragStates[currentLoadedMusic];
            const player = state.musicPlayer;

            if (player) {
                if (player.paused) {
                    player.play().catch(function(error) {
                        console.error('播放失败:', error);
                        alert('播放失败: ' + error.message);
                    });
                } else {
                    player.pause();
                }
            }
        } else {
            console.log('请先将cpntm或weeknd图片拖动到record player上');
            alert('请先将cpntm或weeknd图片拖动到record player上！');
        }
    });

    // 空格键控制播放/暂停
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && currentLoadedMusic) {
            e.preventDefault(); // 防止页面滚动
            const state = dragStates[currentLoadedMusic];
            const player = state.musicPlayer;

            if (player) {
                if (player.paused) {
                    player.play().catch(function(error) {
                        console.error('播放失败:', error);
                    });
                } else {
                    player.pause();
                }
            }
        }

        // ESC键停止播放并弹出当前加载的图片
        if (e.code === 'Escape' && currentLoadedMusic) {
            console.log('按下ESC键，弹出图片并停止音乐');
            const state = dragStates[currentLoadedMusic];

            // 停止音乐
            if (state.musicPlayer) {
                state.musicPlayer.pause();
                state.musicPlayer.currentTime = 0;
            }

            // 显示图片
            if (state.isHidden) {
                state.element.style.opacity = '1';
                state.element.style.pointerEvents = 'auto';
                state.isHidden = false;
            }

            currentLoadedMusic = null;
        }
    });

    // 添加图片加载错误处理
    if (cpntmImg) {
        cpntmImg.addEventListener('error', function() {
            console.error('cpntm.png 图片加载失败');
            cpntmImg.style.display = 'none';
        });
        cpntmImg.addEventListener('load', function() {
            console.log('cpntm.png 图片加载成功');
        });
    }

    if (weekndImg) {
        weekndImg.addEventListener('error', function() {
            console.error('weeknd.png 图片加载失败，请确认文件名和路径是否正确');
            weekndImg.style.display = 'none';
        });
        weekndImg.addEventListener('load', function() {
            console.log('weeknd.png 图片加载成功');
        });
    }

    console.log('音乐播放器脚本加载完成');
    console.log('使用说明：');
    console.log('1. 拖动cpntm图片播放 "We Don\'t Talk Anymore"');
    console.log('2. 拖动weeknd图片播放 "After Hours"');
    console.log('3. 点击record player播放/暂停当前加载的音乐');
    console.log('4. 播放时按空格键控制播放/暂停');
    console.log('5. 按ESC键停止并弹出当前图片');
});
