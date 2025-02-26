<template>
  <div>
    <canvas ref="radarChart"></canvas>
  </div>
</template>

<script>
import { Chart } from 'chart.js';


export default {
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  mounted() {
    this.renderChart();
  },
  methods: {
    renderChart() {
      new Radar(this.$refs.radarChart, {
        type: 'radar',
        data: this.data,
        options: {
          scale: {
            ticks: {
              beginAtZero: true,
              max: 5
            }
          }
        }
      });
    }
  },
  watch: {
    data: {
      handler() {
        this.renderChart();
      },
      deep: true
    }
  }
};
</script>

<style scoped>
canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
