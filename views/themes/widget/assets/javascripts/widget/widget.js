(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node / CommonJS
        factory(require('jquery'));
    } else {
        // Browser globals.
        factory(jQuery);
    }
})(function ($) {

    'use strict';

    var $body = $('body');
    var NAMESPACE = 'qor.widget';
    var EVENT_ENABLE = 'enable.' + NAMESPACE;
    var EVENT_DISABLE = 'disable.' + NAMESPACE;
    var EVENT_CHANGE = 'change.' + NAMESPACE;
    var EVENT_CLICK = 'click.' + NAMESPACE;
    var TARGET_WIDGET = 'select[name="QorResource.Widgets"]';
    var TARGET_WIDGET_KIND = '[name="QorResource.Kind"]';
    var SELECT_FILTER = '[name="QorResource.Widgets"],[name="QorResource.Template"]';
    var CLASS_IS_NEW = 'qor-layout__widget-new';
    var CLASS_FORM_SECTION = '.qor-form-section';
    var CLASS_FORM_SETTING = '.qor-layout__widget-setting';

    function QorWidget(element, options) {
        this.$element = $(element);
        this.options = $.extend({}, QorWidget.DEFAULTS, $.isPlainObject(options) && options);
        this.init();
    }

    QorWidget.prototype = {
        constructor: QorWidget,

        init: function () {
            this.bind();
            this.isNewForm = this.$element.hasClass(CLASS_IS_NEW);
            !this.isNewForm && this.addWidgetSlideout();
            this.initSelect();
        },

        bind: function () {
            this.$element
                .on(EVENT_CHANGE, 'select', this.change.bind(this))
                .on(EVENT_CLICK, '.qor-widget__new', this.getFormHtml.bind(this))
                .on(EVENT_CLICK, '.qor-widget__cancel', this.cancelForm.bind(this));
        },

        unbind: function () {
            this.$element
                .off(EVENT_CHANGE, 'select', this.change.bind(this))
                .off(EVENT_CLICK, '.qor-widget__new', this.getFormHtml.bind(this));

        },

        initSelect: function () {
            var $element = this.$element,
                $select = $element.find('select').filter(SELECT_FILTER),
                $kind = $(TARGET_WIDGET_KIND),
                HINT_TEMPLATE = '<h2 class="qor-page__tips">' + $element.data('hint') + '</h2>';

            $select.closest(CLASS_FORM_SECTION).hide();
            $select.each(function () {
                if ($(this).find('option').filter('[value!=""]').size() >= 2) {
                    $(this).closest(CLASS_FORM_SECTION).show();
                }
            });

            if (!this.isNewForm) {
                if (!$kind.parent().next('.qor-form-section-rows').children().length) {
                    $kind.parent().next('.qor-form-section-rows').append(HINT_TEMPLATE);
                    if (!$element.find('.qor-field__label').not($kind.closest('.qor-form-section').find('.qor-field__label')).is(':visible')) {
                        $kind.closest('.qor-form-section').hide();
                        $element.append(HINT_TEMPLATE).parent().find('.qor-form__actions').remove();
                    }
                }
            }

        },

        addWidgetSlideout: function () {
            var $select = $(TARGET_WIDGET),
                tabScopeActive = $body.data('tabScopeActive'),
                isInSlideout = $('.qor-slideout').is(':visible'),
                $form = $select.closest('form'),
                actionUrl = $form.data("action-url") || $form.prop('action'),
                separator = actionUrl.indexOf('?') !== -1 ? '&' : '?',
                url,
                clickTmpl;

            $select.find('option').each(function () {
                var $this = $(this),
                    val = $this.val();

                if (val) {
                    url = `${actionUrl}${separator}widget_type=${val}`;

                    if (tabScopeActive) {
                        url = `${url}&widget_scope=${tabScopeActive}`;
                    }

                    if (isInSlideout) {
                        clickTmpl = `<a href=${url} style="display: none;" class="qor-widget-${val}" data-open-type="slideout" data-url="${url}">${val}</a>`;
                    } else {
                        clickTmpl = `<a href=${url} style="display: none;" class="qor-widget-${val}">${val}</a>`;
                    }

                    $select.after(clickTmpl);

                }

            });
        },

        change: function (e) {
            let $target = $(e.target),
                widgetValue = $target.val(),
                isInSlideout = $('.qor-slideout').is(':visible'),
                clickClass = '.qor-widget-' + widgetValue,
                $link = $(clickClass),
                url = $link.prop('href');

            if (!$target.is(TARGET_WIDGET)) {
                return;
            }

            $.fn.qorSlideoutBeforeHide = null;
            window.onbeforeunload = null;

            if (!this.isNewForm) {
                if (isInSlideout) {
                    $link.trigger('click');
                } else {
                    location.href = url;
                }
            }

            return false;
        },

        getFormHtml: function (e) {
            let $target = $(e.target).closest('a'),
                widgetType = $target.data('widget-type'),
                $element = this.$element,
                url = $target.attr('href'),
                $title = $element.find('.qor-layout__widget-selector'),
                $selector = $title.find('select'),
                $setting = $(CLASS_FORM_SETTING),
                $sectionSetting = $element.find('[data-section-title="Settings"]'),
                $loading = $(QorWidget.TEMPLATE_LOADING);

            if ($target.hasClass('isShow')) {
                return false;
            }

            if ($sectionSetting.length) {
                $setting = $sectionSetting;
            }

            $loading.appendTo($setting).trigger('enable');

            $target.addClass('isShow');
            $element.find('.qor-slideout__lists-item a').not($target).hide();
            $element.find('.qor-slideout__lists-groupname').hide();
            $element.find('.qor-layout__widget-actions').show();
            $target.closest('li').find('.qor-slideout__lists-groupname').show();

            $.get(url, function (html) {
                $title.show();
                $selector.val(widgetType).closest('.qor-form-section').hide();
                $setting.html(html).trigger('enable');
            }).fail(function () {
                window.alert('server error, please try again!');
            });

            return false;
        },

        cancelForm: function () {
            let $element = this.$element;

            $element.find('.qor-slideout__lists-item a').removeClass('isShow').show();
            $element.find('.qor-slideout__lists-groupname').show();
            $element.find('.qor-layout__widget-actions, .qor-layout__widget-selector').hide();
            $element.find(CLASS_FORM_SETTING).html('');
        },

        destroy: function () {
            this.unbind();
            this.$element.removeData(NAMESPACE);
        }
    };

    QorWidget.DEFAULTS = {};

    QorWidget.TEMPLATE_LOADING = '<div style="text-align: center; margin-top: 30px;"><div class="mdl-spinner mdl-js-spinner is-active qor-layout__bottomsheet-spinner"></div></div>';

    QorWidget.plugin = function (options) {
        return this.each(function () {
            let $this = $(this),
                data = $this.data(NAMESPACE),
                fn;

            if (!data) {
                if (/destroy/.test(options)) {
                    return;
                }

                $this.data(NAMESPACE, (data = new QorWidget(this, options)));
            }

            if (typeof options === 'string' && $.isFunction(fn = data[options])) {
                fn.apply(data);
            }
        });
    };

    $(function () {
        let selector = '[data-toggle="qor.widget"]';

        $(document)
            .on(EVENT_DISABLE, function (e) {
                QorWidget.plugin.call($(selector, e.target), 'destroy');
            })
            .on(EVENT_ENABLE, function (e) {
                QorWidget.plugin.call($(selector, e.target));
            })
            .triggerHandler(EVENT_ENABLE);

        if ($('.qor-page__header .qor-page-subnav__header').length) {
            $('.mdl-layout__content').addClass('has-subnav');
        }
    });

    return QorWidget;

});
