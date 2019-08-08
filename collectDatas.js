(function () {
    var orConfig = {
        url: '',//请求地址
        TRACKING_ID: '',//有效票据 这个需要申请
        srcUrl: 'https://www.google-analytics.com/analytics.js',//js引用地址
        isSendPage: false,//是否请求页面信息
        rumLongTask: false,//是否监听长任务
        entryTypes: ['paint'],
        longtaskTime: 60,
        rumClick: false,
        rumClickTime: 100,
        rumError: false,
    }
    function setConig(config) {
        var config = Object.assign(orConfig, config);
        if (config.TRACKING_ID == '') {
            console.error('TRACKING_ID 不准为空');
            return;
        }
        var createFunctionWithTimeout = function createFunctionWithTimeout(callback, opt_timeout) {//防止analytics未加载导致回调不执行响应正常功能
            var called = false;
            function fn() {
                if (!called) {
                    called = true;
                    callback();
                }
            }
            setTimeout(fn, opt_timeout || 1000);
            return fn;
        };
        (function (i, s, o, g, r, a, m) {
            i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
                (i[r].q = i[r].q || []).push(arguments)
            }, i[r].l = 1 * new Date(); a = s.createElement(o),
                m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
        })(window, document, 'script', config.srcUrl, 'ga');

        var TRACKING_ID = config.TRACKING_ID;
        // window.ga_debug = { trace: true };//开启跟踪路径

        ga('create', TRACKING_ID, 'auto');//生成默认跟踪器uaid通过项目生成否则无法监控
        if (config.url != '') {
            ga('set', 'transportUrl', config.url) //可设置数据传输的url
        }
        ga(function (tracker) {
            // Grab a reference to the default sendHitTask function.
            var originalSendHitTask = tracker.get('sendHitTask');
            tracker.set('sendHitTask', function (model) {
                console.log(model)
                console.log(model.data.m[':hitPayload']);
                model.data.m[':hitPayload'] += "&sua=" + (IsPC() ? "pc" : whichMobile());
                originalSendHitTask(model);

            });
        });
        if (config.isSendPage) {
            ga('send', {//发送页面事务 带上网页路径 可以比较当前页面 在网站中占比
                hitType: 'pageview',
                page: location.pathname
            });
        }
        //fid
        perfMetrics.onFirstInputDelay(function (delay, evt) {
            console.log("================fid延迟类型+时间======================", delay, evt.type)
            ga('send', 'event', {
                eventCategory: 'Perf Metrics',
                eventAction: 'first-input-delay',
                eventLabel: evt.type,
                // Event values must be an integer.
                eventValue: Math.round(delay),
                // Exclude this event from bounce rate calculations.
                nonInteraction: true,
            });
        });

        //FP / FCP    至于   fmp可以从中找一个元素来跟踪
        var observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                // `name` will be either 'first-paint' or 'first-contentful-paint'.
                if (entry.entryType == "paint") {
                    const metricName = entry.name;
                    const time = Math.round(entry.startTime + entry.duration);
                    console.log("===========================发送元素绘制时间============", metricName, "=======")
                    ga('send', 'event', {
                        eventCategory: 'Performance Metrics',
                        eventAction: metricName,
                        eventValue: time,
                        nonInteraction: true,
                    });
                } else if (entry.entryType == "longtask") {
                    if (entry.duration > config.longtaskTime) {
                        console.log("===========================发送长任务============"+entry.entryType+"=========");
                        ga('send', 'event', {
                            eventCategory: 'Performance Metrics',
                            eventAction: entry.entryType,
                            eventValue: Math.round(entry.startTime + entry.duration),
                            eventLabel: JSON.stringify(entry.attribution),
                        });
                    }

                }

            }
        });
        if (config.rumLongTask) {//加入监听类型
            config.entryTypes.push('longtask')
        }
        observer.observe({ entryTypes: config.entryTypes });//开始监听
        //跟踪首次可交互时间 //基于PerformanceObserver
        ttiPolyfill.getFirstConsistentlyInteractive().then((tti) => {
            console.log("================TTI+时间======================", tti)
            ga('send', 'event', {
                eventCategory: 'Performance Metrics',
                eventAction: 'TTI',
                eventValue: tti,
                nonInteraction: true,
            });
        });
    }
    function IsPC() {
        var userAgentInfo = navigator.userAgent;
        var Agents = ["Android", "iPhone",
            "SymbianOS", "Windows Phone",
            "iPad", "iPod"];
        var flag = true;
        for (var v = 0; v < Agents.length; v++) {
            if (userAgentInfo.indexOf(Agents[v]) > 0) {
                flag = false;
                break;
            }
        }
        return flag;
    }
    function whichMobile() {
        var u = navigator.userAgent;
        if (u.indexOf('Android') > -1 || u.indexOf('Linux') > -1) {
            return 'android'
        } else if (u.indexOf('iPhone') > -1) {
            return 'iphone'

        } else if (u.indexOf('Windows Phone') > -1) {
            return 'windowphone'

        } else if (ua.indexOf('micromessenger') != -1) {
            return 'weixin'
        }
    }
    window.cdsetConfig = setConig;
})()