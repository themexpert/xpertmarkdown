jQuery(function($) {
    $(function() {
        var root = window || {},
            isOnline = typeof navigator.onLine !== 'undefined' && navigator.onLine;
        window.addEventListener('online', function() {
            isOnline = true;
        });
        window.addEventListener('offline', function() {
            isOnline = false;
        });
        root.JMEAjax = function(url, settings) {
            if (!isOnline) {
                toastr.error('You appear to be Offline.');
                return false;
            }
            settings = typeof settings === 'undefined' ? typeof url === 'string' ? {} : url : settings;
            settings.url = typeof settings.url === 'undefined' && typeof url === 'string' ? url : settings.url;
            var callbacks = {
                success: typeof settings.success !== 'undefined' ? typeof settings.success === 'function' ? [settings.success] : settings.success : [],
                error: typeof settings.error !== 'undefined' ? typeof settings.error === 'function' ? [settings.error] : settings.error : []
            };
            // if (settings.toastErrors) {
            //     callbacks.error.push(root.JMEAjax.toastErrorHandler);
            //     delete settings.toastErrors;
            // }
            // delete settings.success;
            // delete settings.error;
            var deferred = $.Deferred(),
                jqxhr = $.ajax(settings);
            jqxhr.done(function(response, status, xhr) {
                // console.log(1);
                var responseObject = {
                    response: response,
                    status: status,
                    xhr: xhr
                };
                // console.log(responseObject);
                switch (response.status) {
                    case "unauthenticated":
                        document.location.href = JMEAdmin.config.base_url_relative;
                        throw "Logged out";
                        break;
                    case "unauthorized":
                        responseObject.response.message = responseObject.response.message || "Unauthorized.";
                        root.JMEAjax.errorHandler(deferred, callbacks, responseObject);
                        break;
                    case "error":
                        responseObject.response.message = responseObject.response.message || "Unknown error.";
                        root.JMEAjax.errorHandler(deferred, callbacks, responseObject);
                        break;
                    case "success":
                        root.JMEAjax.successHandler(deferred, callbacks, responseObject);
                        break;
                    default:
                        responseObject.response.message = responseObject.response.message || "Invalid AJAX response.";
                        root.JMEAjax.errorHandler(deferred, callbacks, responseObject);
                        break;
                }
            });
            jqxhr.fail(function(xhr, status, error) {
                var response = {
                    status: 'error',
                    message: error
                };
                root.JMEAjax.errorHandler(deferred, callbacks, {
                    xhr: xhr,
                    status: status,
                    response: response
                });
            });
            root.JMEAjax.jqxhr = jqxhr;
            return deferred;
        };
        root.JMEAjax.successHandler = function(promise, callbacks, response) {
            callbacks = callbacks.success;
            for (var i = 0; i < callbacks.length; i++) {
                if (typeof callbacks[i] === 'function') {
                    callbacks[i](response.response, response.status, response.xhr);
                }
            }
            promise.resolve(response.response, response.status, response.xhr);
        };
        root.JMEAjax.errorHandler = function(promise, callbacks, response) {
            callbacks = callbacks.error;
            for (var i = 0; i < callbacks.length; i++) {
                if (typeof callbacks[i] === 'function') {
                    callbacks[i](response.xhr, response.status, response.response.message);
                }
            }
            promise.reject(response.xhr, response.status, response.response.message);
        };
        root.JMEAjax.toastErrorHandler = function(xhr, status, error) {
            if (status !== 'abort' && !(status == 'error' && error == '')) {
                toastr.error(error);
                // console.log(error);
            }
        };
    });
});