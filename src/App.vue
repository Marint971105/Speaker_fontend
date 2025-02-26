<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import ThemePicker from "@/components/ThemePicker";
import DevicePixelRatio from '@/utils/scale'

console.log('DevicePixelRatio:', DevicePixelRatio);

export default {
  name: "App",
  components: { ThemePicker },
  data() {
    return {
      dpr: null
    };
  },
  metaInfo() {
    return {
      title: this.$store.state.settings.dynamicTitle && this.$store.state.settings.title,
      titleTemplate: title => {
        return title ? `${title} - ${process.env.VUE_APP_TITLE}` : process.env.VUE_APP_TITLE
      }
    }
  },
  methods: {
  },
  created() {
  },
};
</script>

<style scoped>
#app {
  width: 100%;
  height: 100%;
  position: relative;
}

#app .theme-picker {
  display: none;
}
</style>
