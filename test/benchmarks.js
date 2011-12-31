/*jslint browser: true */

function setupBenchmarks() {
    'use strict';

    var fixture = [
        'jQuery 1.7.1',
        'jQuery 1.6.4',
        'jQuery.Mobile 1.0',
        'Prototype 1.7.0.0',
        'Prototype 1.6.1',
        'Ext Core 3.1.0',
        'Ext Core 3.0.0',
        'MooTools 1.4.1',
        'MooTools 1.3.2',
        'Backbone 0.5.3',
        'Underscore 1.2.3'
    ];

    function id(i) {
        return document.getElementById(i);
    }

    function kb(bytes) {
        return (bytes / 1024).toFixed(1);
    }

    function setText(id, str) {
        var el = document.getElementById(id);
        if (typeof el.innerText === 'string') {
            el.innerText = str;
        } else {
            el.textContent = str;
        }
    }

    function slug(name) {
        return name.toLowerCase().replace(/\s/g, '-');
    }

    function enableRunButtons() {
        id('runquick').disabled = false;
        id('runfull').disabled = false;
    }

    function disableRunButtons() {
        id('runquick').disabled = true;
        id('runfull').disabled = true;
    }

    function createTable() {
        var str = '',
            index,
            test,
            name;

        str += '<table>';
        str += '<thead><tr><th>Source</th><th>Size (KiB)</th>';
        str += '<th>Time (ms)</th><th>Variance</th></tr></thead>';
        str += '<tbody>';
        for (index = 0; index < fixture.length; index += 1) {
            test = fixture[index];
            name = slug(test);
            str += '<tr>';
            str += '<td>' + test + '</td>';
            str += '<td id="' + name + '-size"></td>';
            str += '<td id="' + name + '-time"></td>';
            str += '<td id="' + name + '-variance"></td>';
            str += '</tr>';
        }
        str += '<tr><td><b>Total</b></td>';
        str += '<td id="total-size"></td>';
        str += '<td id="total-time"></td>';
        str += '<td></td></tr>';
        str += '</tbody>';
        str += '</table>';

        id('result').innerHTML = str;
    }

    function loadTests() {

        var index = 0,
            totalSize = 0;

        function load(test, callback) {
            var xhr = new XMLHttpRequest(),
                src = '3rdparty/' + test + '.js';

            window.data = window.data || {};
            window.data[test] = '';

            try {
                xhr.timeout = 30000;
                xhr.open('GET', src, true);

                xhr.ontimeout = function () {
                    setText('status', 'Error: time out while loading ' + test);
                    callback.apply();
                };

                xhr.onreadystatechange = function () {
                    var success = false,
                        size = 0;

                    if (this.readyState === XMLHttpRequest.DONE) {
                        if (this.status === 200) {
                            window.data[test] = this.responseText;
                            size = this.responseText.length;
                            totalSize += size;
                            success = true;
                        }
                    }

                    if (success) {
                        setText(test + '-size', kb(size));
                    } else {
                        setText('status', 'Please wait. Error loading ' + src);
                        setText(test + '-size', 'Error');
                    }

                    callback.apply();
                };

                xhr.send(null);
            } catch (e) {
                setText('status', 'Please wait. Error loading ' + src);
                callback.apply();
            }
        }

        function loadNextTest() {
            var test;

            if (index < fixture.length) {
                test = fixture[index];
                index += 1;
                setText('status', 'Please wait. Loading ' + test +
                        ' (' + index + ' of ' + fixture.length + ')');
                window.setTimeout(function () {
                    load(slug(test), loadNextTest);
                }, 100);
            } else {
                setText('total-size', kb(totalSize));
                setText('status', 'Ready.');
                enableRunButtons();
            }
        }

        loadNextTest();
    }

    function runBenchmarks(suite) {

        var index = 0,
            totalTime = 0;

        function reset() {
            var i, name;
            for (i = 0; i < fixture.length; i += 1) {
                name = slug(fixture[i]);
                setText(name + '-time', '');
                setText(name + '-variance', '');
            }
            setText('total-time', '');
        }

        function run() {
            var el, test, source, benchmark;

            if (index >= suite.length) {
                setText('total-time', (1000 * totalTime).toFixed(1));
                setText('status', 'Ready.');
                enableRunButtons();
                return;
            }

            test = slug(suite[index]);
            el = id(test);
            source = window.data[test];
            setText(test + '-time', 'Running...');

            // Force the result to be held in this array, thus defeating any
            // possible "dead core elimination" optimization.
            window.tree = [];

            benchmark = new window.Benchmark(test, function (o) {
                var syntax = window.esprima.parse(source);
                window.tree.push(syntax.body.length);
            }, {
                'onComplete': function () {
                    setText(this.name + '-time', (1000 * this.stats.mean).toFixed(1));
                    setText(this.name + '-variance', (1000 * this.stats.variance).toFixed(1));
                    totalTime += this.stats.mean;
                }
            });

            window.setTimeout(function () {
                benchmark.run();
                index += 1;
                window.setTimeout(run, 211);
            }, 211);
        }


        disableRunButtons();
        setText('status', 'Please wait. Running benchmarks...');

        reset();
        run();
    }

    id('runquick').onclick = function () {
        runBenchmarks(['jQuery 1.7.1', 'jQuery.Mobile 1.0', 'Backbone 0.5.3']);
    };

    id('runfull').onclick = function () {
        runBenchmarks(fixture);
    };

    setText('benchmarkjs-version', ' version ' + window.Benchmark.version);
    setText('version', window.esprima.version);

    createTable();
    disableRunButtons();
    loadTests();
}

