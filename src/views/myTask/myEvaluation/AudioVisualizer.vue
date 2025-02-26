<template>
  <div class="audio-visualizer-container">
    <canvas ref="canvas" class="visualizer-canvas"></canvas>
    <audio
      ref="audioElement"
      :src="audioSrc"
      controls
      class="audio-player"
      @play="startVisualization"
      @pause="stopVisualization"
      @ended="stopVisualization"
    ></audio>
  </div>
</template>

<script>
export default {
  name: 'AudioVisualizer',
  props: {
    audioSrc: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      audioContext: null,
      analyser: null,
      dataArray: null,
      animation: null,
      canvasCtx: null,
      barWidth: 2,
      barGap: 1,
      playing: false
    }
  },
  mounted() {
    this.initCanvas();
  },
  beforeDestroy() {
    this.stopVisualization();
    if (this.audioContext) {
      this.audioContext.close();
    }
  },
  methods: {
    initCanvas() {
      const canvas = this.$refs.canvas;
      this.canvasCtx = canvas.getContext('2d');

      // 设置canvas大小
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // 初始化绘制
      this.drawStaticBars();
    },

    startVisualization() {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const audioElement = this.$refs.audioElement;
        const source = this.audioContext.createMediaElementSource(audioElement);
        this.analyser = this.audioContext.createAnalyser();

        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.analyser.fftSize = 256;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
      }

      this.playing = true;
      this.draw();
    },

    stopVisualization() {
      this.playing = false;
      if (this.animation) {
        cancelAnimationFrame(this.animation);
        this.animation = null;
      }
      // 停止时显示静态条
      this.drawStaticBars();
    },

    draw() {
      if (!this.playing) return;

      const canvas = this.$refs.canvas;
      const canvasCtx = this.canvasCtx;
      const width = canvas.width;
      const height = canvas.height;

      this.animation = requestAnimationFrame(this.draw);

      this.analyser.getByteFrequencyData(this.dataArray);

      canvasCtx.fillStyle = '#f5f7fa';
      canvasCtx.fillRect(0, 0, width, height);

      const barCount = Math.floor(width / (this.barWidth + this.barGap));
      const frequencyStep = Math.floor(this.dataArray.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const frequency = this.dataArray[i * frequencyStep];
        const barHeight = (frequency / 255) * height;

        // 创建渐变色
        const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#409EFF');
        gradient.addColorStop(1, '#53a8ff');

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(
          i * (this.barWidth + this.barGap),
          height - barHeight,
          this.barWidth,
          barHeight
        );
      }
    },

    drawStaticBars() {
      const canvas = this.$refs.canvas;
      const canvasCtx = this.canvasCtx;
      const width = canvas.width;
      const height = canvas.height;

      canvasCtx.fillStyle = '#f5f7fa';
      canvasCtx.fillRect(0, 0, width, height);

      const barCount = Math.floor(width / (this.barWidth + this.barGap));

      for (let i = 0; i < barCount; i++) {
        // 随机高度，但保持在合理范围内
        const barHeight = Math.random() * height * 0.3 + height * 0.1;

        canvasCtx.fillStyle = '#e4e7ed';
        canvasCtx.fillRect(
          i * (this.barWidth + this.barGap),
          height - barHeight,
          this.barWidth,
          barHeight
        );
      }
    }
  }
}
</script>

<style scoped>
.audio-visualizer-container {
  width: 100%;
  height: 300px;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.visualizer-canvas {
  width: 100%;
  height: 200px;
  background: #f5f7fa;
}

.audio-player {
  width: 100%;
  margin-top: 20px;
}
</style>
