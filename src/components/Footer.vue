<script setup lang="ts">
  import { DsfrFooter } from "@gouvminint/vue-dsfr";

  const ecosystemLinks = [
    {
      label: 'géocaptcha.ign.fr',
      href: 'api/v1/#',
      title: 'géocaptcha.ign.fr - nouvelle fenêtre',
    },
    {
      label: 'ign.fr',
      href: 'https://www.ign.fr/',
      title: 'ign.fr - nouvelle fenêtre',
    },
    {
      label: 'ensg.eu',
      href: 'https://www.ensg.eu/fr',
      title: 'ensg.eu - nouvelle fenêtre',
    },
    {
      label: 'github du projet',
      href: 'https://github.com/MaelQllt/PDI14_GeoCaptcha',
      title: 'github du projet - nouvelle fenêtre',
    }
  ];

  const afterMandatoryLinks = [
    {
      label: 'Quillat Maël',
      href: 'https://www.linkedin.com/in/maelquillat/',
      title: 'Quillat Maël - nouvelle fenêtre',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    {
      label: 'Posado Bañuls Diego',
      href: 'https://www.linkedin.com/in/diegoposadobanuls/',
      title: 'Posado Bañuls Diego - nouvelle fenêtre',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    {
      label: 'Fofana Ibrahima',
      href: 'https://www.linkedin.com/in/lahigic/',
      title: 'Fofana Ibrahima - nouvelle fenêtre',
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    {
      label: 'Rathana Clément',
      href: 'https://www.linkedin.com/in/cl%C3%A9ment-rathana/',
      title: 'Rathana Clément - nouvelle fenêtre',
      target: '_blank',
      rel: 'noopener noreferrer',
    }
  ];

  const descText = "Interface administrateur des GéoCaptchas réalisé par des étudiants de" +
      "l'ENSG. Les GéoCaptchas sont des défis Captcha innovants développés par la MARS (Mission " +
      "Architecture Réseau et Sécurité) et qui sont basés sur des données géographiques."
</script>

<template>
  <DsfrFooter
    home-link="/public"
    home-title="GeoCaptchaAdmin"
    :desc-text="descText"
    :ecosystem-links="ecosystemLinks"
    :after-mandatory-links="afterMandatoryLinks"
    licence-text=""
  />
</template>

<style scoped>

</style>