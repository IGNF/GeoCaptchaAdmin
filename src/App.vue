<template>
  <div id="app">
    <Header
    :api-key="apiKey"
    :api-key-locked="apiKeyLocked"
    @update-api-key="updateApiKey"
    @toggle-api-key-lock="toggleApiKeyLock" /> 
    <router-view 
     :api-key="apiKey"
     :app-id="appId" /> 
    <DarkMode />
    <Footer /> 
  </div>
</template>

<script>
import Header from './components/Header.vue';
import Footer from './components/Footer.vue';
import DarkMode from './components/DarkMode.vue';

export default {
  data() {
    return {
      apiKey: sessionStorage.getItem('dashboardApiKey') || null,
      apiKeyLocked: false,
      appId: "admin",
    };
  },
  components: {
    Header,
    Footer,
    DarkMode,
  },
  methods: {
    updateApiKey(value) {
      console.log("App.vue received API key");
      console.log("API key exists:", !!value);
      console.log("API key length:", value?.length);

      this.apiKey = value;

      if (value) {
        sessionStorage.setItem("dashboardApiKey", value);
      } else {
        sessionStorage.removeItem("dashboardApiKey");
      }
    },

    toggleApiKeyLock() {
      this.apiKeyLocked = !this.apiKeyLocked;
    }
  }
}
</script>

<style scoped>
#app {
  overflow-x: hidden; 
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>