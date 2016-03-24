window.closeWidgetEditBox = function () {
  $("iframe").css({ position : "fixed", width : "1", height: "1" });
};

$(document).ready(function () {
  qorWidget = {
    init : function () {
      this.bindingEvents();
      this.initStatus();
    },

    bindingEvents : function () {
      $(".js-widget-button").click(this.openEditBox);
    },

    initStatus : function () {
      this.addIframe();
    },

    openEditBox : function () {
      $("iframe").css({ position : "fixed", width : "100%", height: "100000px", "top" : 0, "left" : 0, "z-index" : 999, "background-color" : "rgba(0, 0, 0, 0.5)" });
    },

    addIframe : function () {
      $("body").append('<iframe src="/admin/widget_instances/frontend-edit" width="1" height="1" style="background-color:transparent;border: none;"></iframe>');
    }
  };
  qorWidget.init();
});
