goog.provide('zx.Visualizer');

goog.require('zx.BitMatrix');

zx.Visualizer = function(window, base, selector, log) {
    this._window = window;
    this._base = base;
    this._client = new zx.HTTPClient(base);
    this._selector = selector;
    this._delay = 5000;
    this._log = log;
};

zx.Visualizer.prototype.run = function() {
    this.update();
};

zx.Visualizer.prototype.update = function() {
    var ctx = this;
    var client = this._client;
    var failure = function(failedResponse) {
        ctx.log('failed for reason: ' + failedResponse.getFailureReason());
        ctx.scheduleUpdate_();
    };
    var visualizer = new zx.CanvasVisualizer();
    var document = this._window.document;
    var selectorResult = document.querySelectorAll(this._selector);

    client.get('/work/recent?limit=' + selectorResult.length).then(function(response) {
        var results = response.getResult().map(zx.RecentWork.unpack);
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var container = selectorResult[i];
            var imageContainer = container.querySelector('.image');
            var nameContainer = container.querySelector('.name');
            var canvas = document.createElement('canvas');
            var img = document.createElement('img');
            canvas.width = imageContainer.offsetWidth;
            canvas.height = imageContainer.offsetHeight;
            visualizer.visualize(zx.BitMatrix.unpack(result.getResultField('matrix')), canvas);
            img.src = canvas.toDataURL();

            while (imageContainer.firstChild) {
                imageContainer.removeChild(imageContainer.firstChild);
            }
            imageContainer.appendChild(img);
            nameContainer.textContent = result.getResultField('name');
        }

        ctx.log('added ' + results.length + ' results');
        ctx.scheduleUpdate_();
    }, failure);
};

zx.Visualizer.prototype.log = function(msg) {
    if (typeof(this._log) === 'function') {
        return this._log('' + msg);
    }
};

zx.Visualizer.prototype.scheduleUpdate_ = function() {
    var ref = this;
    this._window.setTimeout(function() {
        ref.update();
    }, this._delay);
};
