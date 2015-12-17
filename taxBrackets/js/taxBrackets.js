'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TaxBrackets = (function () {
  function TaxBrackets(taxSystems, config) {
    var _this = this;

    _classCallCheck(this, TaxBrackets);

    this.config = {
      outerWidth: config && config.outerWidth ? config.outerWidth : 1000,
      outerHeight: config && config.outerHeight ? config.outerHeight : 100,
      boxMargin: config && config.boxMargin ? config.boxMargin : { top: 0, right: 25, bottom: 0, left: 25 },
      barMargin: config && config.barMargin ? config.barMargin : 2,
      animationTime: config && config.animationTime ? config.animationTime : 1000
    };
    this.config.innerWidth = this.config.outerWidth - this.config.boxMargin.left - this.config.boxMargin.right;
    this.config.innerHeight = this.config.outerHeight - this.config.boxMargin.top - this.config.boxMargin.bottom;

    this.taxSystems = taxSystems;
    this.innerFrames = [];

    var svg = d3.select('#taxBrackets').attr('width', this.config.outerWidth).attr('height', this.config.outerHeight * this.taxSystems.length);

    this.taxSystems.forEach(function (taxSystem, index) {
      var leftMargin = _this.config.boxMargin.left,
          topMargin = _this.config.boxMargin.top + _this.config.outerHeight * index;
      var thisFrame = svg.append('g').attr('transform', 'translate(' + leftMargin + ',' + topMargin + ')');
      _this.innerFrames.push(thisFrame);
    });
  }

  _createClass(TaxBrackets, [{
    key: '_calculateDetailed',
    value: function _calculateDetailed(taxBrackets, salary) {
      // this is just a proof of concept, very ugly code
      var graphData = [],
          lastLimit = 0,
          segmentLength = undefined;
      taxBrackets.forEach(function (bracket, index) {
        if (salary > lastLimit) {
          var start = undefined,
              end = undefined,
              percent = undefined,
              taxLength = undefined;
          start = index === 0 ? 0 : graphData[graphData.length - 1].end;
          end = salary < bracket.limit ? salary : bracket.limit;
          if (end < 0) {
            end = salary;
          };
          percent = bracket.taxValue;
          taxLength = Math.floor((end - start) * percent / 100);
          graphData.push({ start: start, end: end, percent: percent, taxLength: taxLength });
          lastLimit = bracket.limit;
        }
      });
      return graphData;
    }
  }, {
    key: '_calculateOverall',
    value: function _calculateOverall(taxBrackets, salary) {
      var lastLimit = 0,
          start = 0,
          end = salary,
          percent = undefined,
          taxLength = 0;
      taxBrackets.forEach(function (bracket, index) {
        if (salary > lastLimit) {
          var bracketStart = index === 0 ? 0 : taxBrackets[index - 1].limit;
          var bracketEnd = salary < bracket.limit ? salary : bracket.limit;
          if (bracketEnd < 0) {
            bracketEnd = salary;
          };
          taxLength += Math.floor((bracketEnd - bracketStart) * bracket.taxValue / 100);
          lastLimit = bracket.limit;
        }
      });
      percent = Math.round(taxLength / salary * 10000) / 100;
      return [{ start: start, end: end, percent: percent, taxLength: taxLength }];
    }
  }, {
    key: '_renderGraph',
    value: function _renderGraph(thisFrame, graphData) {
      // create graphConfig object and unpack
      var c = this.config;

      var xScale = d3.scale.linear().rangeRound([0, c.innerWidth])
      // be ready to change to logscale with big values
      .domain([0, graphData[graphData.length - 1].end]);

      var salaryRects = thisFrame.selectAll('.salary').data(graphData);
      salaryRects /* enter phase */
      .enter().append('rect').attr('class', 'salary').attr('x', function (d) {
        return xScale(d.start);
      }).attr('y', 50).attr('width', 0).attr('height', 25).transition().duration(c.animationTime).attr('x', function (d) {
        return xScale(d.start);
      }).attr('width', function (d) {
        return xScale(d.end - d.start) - c.barMargin;
      });
      salaryRects /* update phase */
      .transition().duration(c.animationTime).attr('x', function (d) {
        return xScale(d.start);
      }).attr('width', function (d) {
        return xScale(d.end - d.start) - c.barMargin;
      });
      salaryRects /* exit phase */
      .exit().transition().duration(c.animationTime / 2).attr('width', 0).remove();
      var taxRects = thisFrame.selectAll('.tax').data(graphData);
      taxRects.enter().append('rect').attr('class', 'tax').attr('x', function (d) {
        return xScale(d.start);
      }).attr('y', 25).attr('width', 0).attr('height', 50).transition().duration(c.animationTime).attr('width', function (d) {
        return xScale(d.taxLength);
      });
      taxRects.transition().duration(c.animationTime).attr('x', function (d) {
        return xScale(d.start);
      }).attr('width', function (d) {
        return xScale(d.taxLength);
      });
      taxRects.exit().transition().duration(c.animationTime / 2).attr('width', 0).remove();
      var percentLegend = thisFrame.selectAll('.percent').data(graphData);
      percentLegend.enter().append('text').attr('class', 'percent').attr('x', function (d) {
        return xScale(d.start);
      }).attr('y', 20).text(function (d) {
        return d.percent + '%';
      }).style("text-anchor", "middle").transition().duration(c.animationTime).attr('x', function (d) {
        return xScale(d.start + (d.end - d.start) / 2);
      });
      percentLegend.transition().duration(c.animationTime).text(function (d) {
        return d.percent + '%';
      }).attr('x', function (d) {
        return xScale(d.start + (d.end - d.start) / 2);
      });
      percentLegend.exit().transition().duration(c.animationTime / 2).attr('x', 0).remove();
      var bracketLegend = thisFrame.selectAll('.bracket-limit').data(graphData);
      bracketLegend.enter().append('text').attr('class', 'bracket-limit').attr('x', function (d) {
        return xScale(d.start);
      }).attr('y', 90).text(function (d) {
        return d.end + ' PLN';
      }).style("text-anchor", "end").transition().duration(c.animationTime).attr('x', function (d) {
        return xScale(d.end);
      });
      bracketLegend.transition().duration(c.animationTime).text(function (d) {
        return d.end + ' PLN';
      }).attr('x', function (d) {
        return xScale(d.end);
      });
      bracketLegend.exit().transition().duration(c.animationTime / 2).attr('x', 0).remove();
    }
  }, {
    key: 'initGraph',
    value: function initGraph(salary) {
      this.salary = salary;
      this.showOverall();
    }
  }, {
    key: 'showOverall',
    value: function showOverall() {
      var _this2 = this;

      this.innerFrames.forEach(function (_, index) {
        var graphData = _this2._calculateOverall(_this2.taxSystems[index].brackets, _this2.salary);
        _this2._renderGraph(_this2.innerFrames[index], graphData);
      });
    }
  }, {
    key: 'showDetailed',
    value: function showDetailed() {
      var _this3 = this;

      this.innerFrames.forEach(function (_, index) {
        var graphData = _this3._calculateDetailed(_this3.taxSystems[index].brackets, _this3.salary);
        _this3._renderGraph(_this3.innerFrames[index], graphData);
      });
    }
  }]);

  return TaxBrackets;
})();