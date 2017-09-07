(() => {
  'use strict';
  const baseUrl = baseUrlRepository['oms-notification-cast'];
  const apiUrl = `${baseUrl}api/`;

  const showError = (err) => {
    console.log(err);
    let message = 'Unknown cause';

    if (err && err.message) {
      message = err.message;
    } else if (err && err.data && err.data.message) {
      message = err.data.message;
    }

    $.gritter.add({
      title: 'Error',
      text: `Could not process action: ${message}`,
      sticky: false,
      time: 8000,
      class_name: 'my-sticky-class',
    });
  };

  /** @ngInject */
  function config($stateProvider) {
    // State
    $stateProvider
      .state('app.notification_cast', {
        url: '/notification_cast',
        data: { pageTitle: 'Cast a notification' },
        views: {
          'pageContent@app': {
            templateUrl: `${baseUrl}cast/cast.html`,
            controller: 'NotificationCastController as vm',
          },
        },
      });
  }

  function NotificationCastController($http) {
    var vm = this;
  }

  angular
    .module('app.notification_cast', [])
    .config(config)
    .controller('NotificationCastController', NotificationCastController);
})();

