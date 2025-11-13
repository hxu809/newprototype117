// 拖动功能实现 - 支持多个图片关联不同音乐
document.addEventListener('DOMContentLoaded', function() {
    const cpntmImg = document.querySelector('.cpntm-img');
    const weekndImg = document.querySelector('.weeknd-img');
    const beatlesImg = document.querySelector('.beatles-img');
    const recordPlayerImg = document.querySelector('.record-player-img');
    const cpntmMusicPlayer = document.getElementById('music-player-cpntm');
    const weekndMusicPlayer = document.getElementById('music-player-weeknd');
    const beatlesMusicPlayer = document.getElementById('music-player-beatles');
    const nowPlayingDiv = document.getElementById('now-playing');
    const canvas = document.getElementById('visualizer-canvas');
    const canvasCtx = canvas.getContext('2d');

    // 设置canvas尺寸
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 音频可视化相关变量
    let audioContext = null;
    let analyserNode = null;
    let dataArray = null;
    let bufferLength = 0;
    let animationId = null;
    let currentVisualizerType = null;
    const audioSources = {}; // 存储每个播放器的音频源

    // ========== 粒子系统 ==========
    const particles = [];
    let particleAnimationId = null;
    let particleGenerationInterval = null;

    // 粒子类
    class Particle {
        constructor(x, y, emoji, type) {
            this.x = x;
            this.y = y;
            this.emoji = emoji;
            this.type = type;
            this.element = document.createElement('div');
            this.element.className = 'particle';
            this.element.textContent = emoji;
            this.element.style.left = x + 'px';
            this.element.style.top = y + 'px';
            document.body.appendChild(this.element);

            // 根据类型设置不同的物理属性
            if (type === 'cpntm') {
                // 流泪效果：从上方随机位置落下
                this.vx = (Math.random() - 0.5) * 2; // 轻微水平移动
                this.vy = Math.random() * 2 + 1; // 向下的初速度
                this.gravity = 0.3; // 重力加速度
                this.opacity = 1;
                this.life = 100; // 生命周期
            } else if (type === 'weeknd') {
                // 爆炸效果：从中心向外爆炸
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 8 + 4;
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                this.gravity = 0.2; // 轻微重力
                this.friction = 0.98; // 摩擦力（减速）
                this.opacity = 1;
                this.life = 100;
                this.rotation = Math.random() * 360; // 旋转角度
                this.rotationSpeed = (Math.random() - 0.5) * 10; // 旋转速度
            } else if (type === 'beatles') {
                // 爱心效果：向上飘散
                this.vx = (Math.random() - 0.5) * 3;
                this.vy = -(Math.random() * 3 + 2); // 向上飘
                this.gravity = -0.05; // 轻微向上的力
                this.opacity = 1;
                this.life = 120;
                this.scale = Math.random() * 0.5 + 0.5; // 随机大小
                this.wobble = Math.random() * Math.PI * 2; // 摆动相位
                this.wobbleSpeed = 0.1;
            }
        }

        update() {
            // 更新速度
            if (this.type === 'cpntm') {
                this.vy += this.gravity;
                this.x += this.vx;
                this.y += this.vy;
            } else if (this.type === 'weeknd') {
                this.vx *= this.friction;
                this.vy *= this.friction;
                this.vy += this.gravity;
                this.x += this.vx;
                this.y += this.vy;
                this.rotation += this.rotationSpeed;
            } else if (this.type === 'beatles') {
                this.vy += this.gravity;
                this.wobble += this.wobbleSpeed;
                this.x += this.vx + Math.sin(this.wobble) * 0.5; // 添加摆动
                this.y += this.vy;
            }

            // 更新生命周期和透明度
            this.life--;
            this.opacity = this.life / 100;

            // 更新DOM元素位置
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
            this.element.style.opacity = this.opacity;

            if (this.type === 'weeknd') {
                this.element.style.transform = `rotate(${this.rotation}deg)`;
            } else if (this.type === 'beatles') {
                this.element.style.transform = `scale(${this.scale})`;
            }

            // 检查是否超出屏幕或生命周期结束
            return this.life > 0 &&
                   this.x > -100 && this.x < window.innerWidth + 100 &&
                   this.y > -100 && this.y < window.innerHeight + 100;
        }

        destroy() {
            this.element.remove();
        }
    }

    // 获取record player的位置
    function getRecordPlayerPosition() {
        const rect = recordPlayerImg.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height
        };
    }

    // 生成粒子
    function generateParticle(type) {
        const pos = getRecordPlayerPosition();
        let x, y, emoji;

        if (type === 'cpntm') {
            // 流泪：从record player上方随机位置生成
            x = pos.x + (Math.random() - 0.5) * pos.width * 0.8;
            y = pos.y - pos.height * 0.3;
            emoji = Math.random() > 0.5 ? '😢' : '💧';
        } else if (type === 'weeknd') {
            // 爆炸：从record player中心生成
            x = pos.x;
            y = pos.y;
            emoji = ['💥', '⚡', '✨', '🔥'][Math.floor(Math.random() * 4)];
        } else if (type === 'beatles') {
            // 爱心：从record player周围生成
            const angle = Math.random() * Math.PI * 2;
            const radius = pos.width * 0.3;
            x = pos.x + Math.cos(angle) * radius;
            y = pos.y + Math.sin(angle) * radius;
            emoji = ['❤️', '💕', '💖', '💗'][Math.floor(Math.random() * 4)];
        }

        const particle = new Particle(x, y, emoji, type);
        particles.push(particle);
    }

    // 更新所有粒子
    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            if (!particles[i].update()) {
                particles[i].destroy();
                particles.splice(i, 1);
            }
        }

        if (particles.length > 0 || particleGenerationInterval) {
            particleAnimationId = requestAnimationFrame(updateParticles);
        }
    }

    // 启动粒子系统
    function startParticles(type) {
        stopParticles(); // 先停止之前的

        // 开始生成粒子
        if (type === 'cpntm') {
            particleGenerationInterval = setInterval(() => {
                generateParticle(type);
            }, 200); // 每200ms生成一个泪珠
        } else if (type === 'weeknd') {
            particleGenerationInterval = setInterval(() => {
                // 每次生成多个粒子形成爆炸效果
                for (let i = 0; i < 3; i++) {
                    generateParticle(type);
                }
            }, 150); // 更频繁的爆炸
        } else if (type === 'beatles') {
            particleGenerationInterval = setInterval(() => {
                generateParticle(type);
            }, 180); // 每180ms生成一个爱心
        }

        // 启动粒子动画循环
        if (!particleAnimationId) {
            updateParticles();
        }
    }

    // 停止粒子系统
    function stopParticles() {
        if (particleGenerationInterval) {
            clearInterval(particleGenerationInterval);
            particleGenerationInterval = null;
        }

        // 清除所有现有粒子
        particles.forEach(p => p.destroy());
        particles.length = 0;

        if (particleAnimationId) {
            cancelAnimationFrame(particleAnimationId);
            particleAnimationId = null;
        }
    }

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
        },
        beatles: {
            element: beatlesImg,
            musicPlayer: beatlesMusicPlayer,
            musicName: 'Oh! Darling',
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

    let currentLoadedMusic = null; // 当前加载的音乐类型 ('cpntm', 'weeknd', 或 'beatles')
    let currentDraggingKey = null; // 当前正在拖拽的元素key

    // 调试：检查音频是否可以加载
    console.log('音乐播放器初始化:');
    console.log('  - cpntm音乐播放器:', cpntmMusicPlayer);
    console.log('  - weeknd音乐播放器:', weekndMusicPlayer);
    console.log('  - beatles音乐播放器:', beatlesMusicPlayer);

    // 背景效果管理函数
    function setBackgroundEffect(key) {
        // 移除所有背景效果类
        document.body.classList.remove('playing-cpntm', 'playing-weeknd', 'playing-beatles');

        // 添加对应的背景效果类
        if (key) {
            document.body.classList.add(`playing-${key}`);
            console.log(`已应用 ${key} 的背景效果`);
        }
    }

    // 显示Now Playing信息
    function showNowPlaying(musicName) {
        if (!nowPlayingDiv) return;

        nowPlayingDiv.textContent = `Now Playing: ${musicName}`;
        nowPlayingDiv.classList.remove('hide');
        nowPlayingDiv.classList.add('show');
    }

    // 隐藏Now Playing信息
    function hideNowPlaying() {
        if (!nowPlayingDiv) return;

        nowPlayingDiv.classList.remove('show');
        nowPlayingDiv.classList.add('hide');
    }

    // 初始化音频上下文和分析器
    function initAudioContext(key, player) {
        // 初始化AudioContext（只创建一次）
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // 初始化Analyser节点（只创建一次）
        if (!analyserNode) {
            analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 256;
            bufferLength = analyserNode.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            analyserNode.connect(audioContext.destination);
        }

        // 为每个播放器创建独立的音频源（每个播放器只创建一次）
        if (!audioSources[key]) {
            const source = audioContext.createMediaElementSource(player);
            source.connect(analyserNode);
            audioSources[key] = source;
            console.log(`已为 ${key} 创建音频源`);
        }
    }

    // Weeknd可视化 - 彩色频谱条形图
    function drawWeekndVisualizer() {
        analyserNode.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

            const hue = (i / bufferLength) * 360;
            canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    // Beatles可视化 - 圆形脉冲波形
    function drawBeatlesVisualizer() {
        analyserNode.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(canvas.width, canvas.height) / 4;

        for (let i = 0; i < bufferLength; i++) {
            const angle = (i / bufferLength) * Math.PI * 2;
            const amplitude = (dataArray[i] / 255) * radius;
            const x = centerX + Math.cos(angle) * (radius + amplitude);
            const y = centerY + Math.sin(angle) * (radius + amplitude);

            const intensity = dataArray[i] / 255;
            canvasCtx.fillStyle = `rgba(255, ${50 + intensity * 100}, 0, ${0.5 + intensity * 0.5})`;
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 3 + intensity * 5, 0, Math.PI * 2);
            canvasCtx.fill();
        }
    }

    // CPNTM可视化 - 舒缓波形图
    function drawCpntmVisualizer() {
        analyserNode.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 3;
        canvasCtx.strokeStyle = 'rgba(100, 150, 255, 0.8)';
        canvasCtx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = (v * canvas.height) / 2;

            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }

    // 启动可视化
    function startVisualizer(type) {
        if (!analyserNode) return;

        currentVisualizerType = type;
        canvas.classList.add('active');

        function animate() {
            animationId = requestAnimationFrame(animate);

            if (currentVisualizerType === 'weeknd') {
                drawWeekndVisualizer();
            } else if (currentVisualizerType === 'beatles') {
                drawBeatlesVisualizer();
            } else if (currentVisualizerType === 'cpntm') {
                drawCpntmVisualizer();
            }
        }

        animate();
    }

    // 停止可视化
    function stopVisualizer() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        currentVisualizerType = null;
        canvas.classList.remove('active');
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    }

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

            // 初始化音频上下文（只在第一次播放时）
            try {
                if (!audioSources[key]) {
                    initAudioContext(key, player);
                }
            } catch (error) {
                console.error('音频上下文初始化失败:', error);
            }

            // 应用对应的背景效果
            setBackgroundEffect(key);
            // 显示Now Playing信息
            showNowPlaying(musicName);
            // 启动可视化
            startVisualizer(key);
            // 启动粒子系统
            startParticles(key);
        });

        player.addEventListener('pause', function() {
            console.log(`${musicName} 暂停`);
            // 移除背景效果
            setBackgroundEffect(null);
            // 隐藏Now Playing信息
            hideNowPlaying();
            // 停止可视化
            stopVisualizer();
            // 停止粒子系统
            stopParticles();
        });
    }

    setupMusicPlayer('cpntm', cpntmMusicPlayer, 'We Don\'t Talk Anymore');
    setupMusicPlayer('weeknd', weekndMusicPlayer, 'After Hours');
    setupMusicPlayer('beatles', beatlesMusicPlayer, 'Oh! Darling');

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
    setupDraggable('beatles', beatlesImg);

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

    if (beatlesImg) {
        beatlesImg.addEventListener('error', function() {
            console.error('Beatles.png 图片加载失败，请确认文件名和路径是否正确');
            beatlesImg.style.display = 'none';
        });
        beatlesImg.addEventListener('load', function() {
            console.log('Beatles.png 图片加载成功');
        });
    }

    console.log('音乐播放器脚本加载完成');
    console.log('使用说明：');
    console.log('1. 拖动cpntm图片播放 "We Don\'t Talk Anymore"');
    console.log('2. 拖动weeknd图片播放 "After Hours"');
    console.log('3. 拖动beatles图片播放 "Oh! Darling"');
    console.log('4. 点击record player播放/暂停当前加载的音乐');
    console.log('5. 播放时按空格键控制播放/暂停');
    console.log('6. 按ESC键停止并弹出当前图片');
});
