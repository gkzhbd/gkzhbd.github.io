/* Copyright 2017 Esri

   Licensed under the Apache License, Version 2.0 (the "License");

   you may not use this file except in compliance with the License.

   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software

   distributed under the License is distributed on an "AS IS" BASIS,

   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

   See the License for the specific language governing permissions and

   limitations under the License.*/

/*********************************************
 * This class builds the graph that displays
 * the correlation between building height and
 * construction year.
 ********************************************/

define([
  "dojo/dom",
  "dojo/_base/declare",
  "d3"
], function(dom, declare, d3) {
  return declare(null, {

    constructor: function(container, settings, features, state) {

      // general settings for the svg area
      this.width = 1043;
      this.height = document.getElementById(container).clientHeight;
      this.paddingLeft = 135;
      this.paddingTop = 20;
      this.paddingBottom = 15;
      this.ageClasses = settings.ageClasses;
      this.defaultColor = settings.defaultColor;
      this.highlightColor = "rgb(" + settings.highlightOptions.color.slice(0, 3).join(",") + ")";

      // define svg
      var svg = d3.select("#" + container)
        .append("svg")
        .attr("height", this.height)
        .attr("width", this.width + 2);

      // create scales
      var buildingOptions = settings.buildingOptions;
      var xScale = d3.scaleLinear()
        .domain([1899, buildingOptions.maxCnstrctYear])
        .range([this.paddingLeft, this.width]);
      var yScale = d3.scaleLinear()
        .domain([0, buildingOptions.maxHeight])
        .range([this.height - this.paddingBottom, this.paddingTop]);

      // create axes
      var yAxis = d3.axisLeft(yScale)
        .tickValues([0, 50, 100, 150])
        .tickFormat(function(d) {
          if (d === 150) {
            return d + " m";
          }
          else {
            return d;
          }
        })
        .tickPadding(10);

      // add helper lines that will show the values on the vertical axis
      function appendHorizontalLine(x1, y1, x2, y2) {
        svg.append("line")
          .attr("x1", x1)
          .attr("y1", yScale(y1))
          .attr("x2", xScale(x2))
          .attr("y2", yScale(y2))
          .style("stroke-dasharray", "2, 2")
          .style("stroke", "#bbb");
      }
      appendHorizontalLine(this.paddingLeft, 100, 2025, 100);
      appendHorizontalLine(this.paddingLeft, 50, 2025, 50);
      appendHorizontalLine(this.paddingLeft, 0, 2025, 0);
      appendHorizontalLine(this.paddingLeft, 127, 2011, 127);

      // add delay before filtering to make sure Loading is displayed
      function delayFilter (status, state, yScale, d3event){
        if (!status) {

          oldMin = 0;
          oldMax = 150;
          if (state.filteredBuildings)
          {
            oldMin = state.filteredBuildings[0];
            oldMax = state.filteredBuildings[1];
          } 
          newRange = [yScale.invert(d3event.selection[1]), yScale.invert(d3event.selection[0])];

          newMax = newRange[1];
          newMin = newRange[0];
          if ((Math.abs(newMin - oldMin) == 0) && (Math.abs(newMax - oldMax) == 0)) {
            dom.byId("loading").style.display = "none";
          } else {
            state.filteredBuildings = newRange;
          }
          
          return;

        } else {
          dom.byId("loading").style.display = "inline";
          setTimeout (delayFilter, 200, false, state, yScale, d3event);
        }
      }

      // add image of the building to better understand the vertical height axis
      svg.append("image")
          .attr("xlink:href", "./img/prime_tower_2.png")
          .attr("y", 36)
          .attr("x", 10)
          .attr("height", this.height - 43)
          .attr("width", 69); 

     // handlers for filtering
      /*var groupHandlers = svg.append("g");
        groupHandlers.append("rect")
        .classed("top", true)
        .attr("x", xScale(2020))
        .attr("y", yScale(buildingOptions.maxHeight) - 9)
        .attr("width", 50)
        .attr("height", 6)
        .attr("rx", 5)
        .attr("ry", 0)
        .attr("cursor", "ns-resize")
        .style("fill", "#bbb");
      groupHandlers.append("rect")
        .classed("bottom", true)
        .attr("x", xScale(2020))
        .attr("y", yScale(buildingOptions.minHeight) - 1)
        .attr("width", 50)
        .attr("height", 6)
        .attr("rx", 5)
        .attr("ry", 0)
        .attr("cursor", "ns-resize")
        .style("fill", "#bbb");*/
        
      // define vertical axis and append it to the svg container
      var yAxisGroup = svg.append("g")
        .attr("transform", "translate(" + this.paddingLeft +", 0)")
        .call(yAxis);

      // brush added for filtering
      var brush = d3.brushY()
        .extent([[0, this.paddingTop],[this.width, this.height - this.paddingBottom]]);
      yAxisGroup.call(brush).call(brush.move, [yScale(buildingOptions.maxHeight), yScale(buildingOptions.minHeight)]);
      svg.select(".overlay").attr("display","none");

      // add building features as circles to the graph
      var circles = svg.selectAll("circle")
        .data(features)
        .enter()
        .append("circle")
        .attr("r",  function(d) {
          if (d.attributes.cnstrct_yr < 1900) {
            return 1
          }
          else {
            return 3.5
          };
        })
        .attr("opacity",  function(d) {
          if (d.attributes.cnstrct_yr < 1900) {
            return 0
          }
          else {
            return 1
          };
        })
        .attr("class", function(d) {
          var value;
          settings.ageClasses.forEach(function(e, i) {
            if (e.minValue <= d.attributes.cnstrct_yr && d.attributes.cnstrct_yr <= e.maxValue) {
              value = i;
            }
          });
          return "construct-" + value;
        })
        .classed("circle", true)
        .attr("id", function(d) {
          return "id-" + d.attributes.objectid;
        })
        .attr("fill", function(d) {
          var value = settings.ageClasses.filter(function(e) {
            return (e.minValue <= d.attributes.cnstrct_yr && d.attributes.cnstrct_yr <= e.maxValue);
          });

          if (value[0].color.length === 4) {
            return "rgba(" + value[0].color.join(",") + ")";
          }
          else {
            return "rgba(" + value[0].color.join(",") + ",0.7)";
          }
        })
        .attr("cx", function(d) {
          return xScale(d.attributes.cnstrct_yr);
        })
        .attr("cy", function(d) {
          return yScale(d.attributes.heightroof);
        })
        .on("mouseover", function(d) {
          state.hoveredBuilding = d;
        })
        .on("mouseout", function() {
          state.hoveredBuilding = null;
        })
        .on("click", function(d) {
          state.selectedBuilding = d;
        });

      // add text that shows the height of the buildings that are filtered
      svg.append("text")
        .attr("x", this.paddingLeft + 2)
        .attr("id", "upper-indicator");

      svg.append("text")
        .attr("x", this.paddingLeft + 2)
        .attr("id", "lower-indicator");

      // add event listeners when filters are changed
      brush.on("brush", function() {
          svg.select("#upper-indicator")
            .attr("y", d3.event.selection[0] - 1)
            .text(Math.round(yScale.invert(d3.event.selection[0])));
          svg.select("#lower-indicator")
            .attr("y", d3.event.selection[1] + 15)
            .text(Math.round(yScale.invert(d3.event.selection[1])));
          state.filteredBuildings = [yScale.invert(d3.event.selection[1]), yScale.invert(d3.event.selection[0])];
      });
      brush.on("end", function() {
        svg.select("#upper-indicator")
          .text("");
        svg.select("#lower-indicator")
          .text("");
        if (!d3.event.selection) {
          yAxisGroup.call(brush).call(brush.move, [yScale(1500), yScale(0)]);
        }
	
      //delayFilter (true, state, yScale, d3.event);

      });

      // add the circles and the selection and hovering groups to the class
      this.circles = circles;
      this.selectContainer = svg.append("g");
      this.hoverContainer = svg.append("g");
    },

    // on hover add information about the building and a circle that acts like a highlight
    hover: function(d) {
      if (d.attributes.cnstrct_yr > 1899) {
      var elem = d3.select("#id-" + d.attributes.objectid);
      var cx = parseInt(elem.attr("cx"), 10),
        cy = parseInt(elem.attr("cy"), 10);
      this.hoverContainer.append("line")
        .attr("class", "hover-graphic")
        .attr("x1", cx)
        .attr("y1", cy - 4)
        .attr("x2", cx)
        .attr("y2", cy - 15)
        .style("stroke", "#000");
      this.hoverContainer.append("circle")
        .attr("class", "hover-graphic")
        .attr("r", 8)
        .attr("cx", parseInt(elem.attr("cx"), 10))
        .attr("cy", parseInt(elem.attr("cy"), 10))
        .attr("stroke-width", 4)
        .attr("stroke", this.highlightColor)
        .attr("fill", "none");
      var rect = this.hoverContainer.append("rect")
        .attr("class", "hover-graphic");
      var text = this.hoverContainer.append("text")
        .attr("class", "tooltip")
        .classed("hover-graphic", true)
        .attr("x", cx)
        .attr("y", cy - 21)
        .attr("text-anchor", "end")
        .text(function() {
          var a = d.attributes;
          var name = a.name === "baulicher Akzent"  || a.name === null || a.name === "St.-Jakobs-Kirche (Zürich)" || (a.name === "Kirche" && a.cnstrct_yr === 1900) ? " " : a.name; //Gebäude mit Nullwert, "baulicher Akzent" oder "St.-Jakobs-Kirche (Zürich)" im Namensfeld werden ignoriert bei der Beschriftung der tooltips im Diagramm
          var status = a.cnstrct_yr > 2020  ? " geplant " : " gebaut ";
          return name + status + a.cnstrct_yr + "; Höhe " + Math.round(parseFloat(a.heightroof)) + " m";
        });
      var bbox = text.node().getBBox();

      //Codesnippet für zweizeilige Popups im HeightDiagramm. Deaktiviert, da nicht mit Firefox kompatibel

      /*hover: function(d) {
        var elem = d3.select("#id-" + d.attributes.objectid);
        var cx = parseInt(elem.attr("cx"), 10),
          cy = parseInt(elem.attr("cy"), 10);
        this.hoverContainer.append("line")
          .attr("class", "hover-graphic")
          .attr("x1", cx)
          .attr("y1", cy - 4)
          .attr("x2", cx)
          .attr("y2", cy - 15)
          .style("stroke", "#000");
        this.hoverContainer.append("circle")
          .attr("class", "hover-graphic")
          .attr("r", 8)
          .attr("cx", parseInt(elem.attr("cx"), 10))
          .attr("cy", parseInt(elem.attr("cy"), 10))
          .attr("stroke-width", 4)
          .attr("stroke", this.highlightColor)
          .attr("fill", "none");
        var rect = this.hoverContainer.append("rect")
          .attr("class", "hover-graphic");
        var text = this.hoverContainer.append("text")
          .attr("class", "tooltip")
          .classed("hover-graphic", true)
          .attr("x", cx)
          .attr("y", cy - 21)
          .attr("text-anchor", "end")
		  .append("tspan")
		  .attr("x", cx)
		  .attr("class", "text")
		  .text(function() {
            var a = d.attributes;
            return a.name !== " " ? a.name : "Building " + a.name;
			})
		  .append("tspan")
		  .attr("class", "text")
		  .attr("x", cx)
		  .attr("dy", "1em")
		  .text(function() {
            var a = d.attributes;
            return "gebaut " + a.cnstrct_yr + "; Höhe " + Math.round(parseFloat(a.heightroof)) + "m";
          });
        var bbox = text.node().getBBox();*/

        rect.attr("x", bbox.x - 4)
          .attr("y", bbox.y - 4)
          .attr("width", bbox.width + 8)
          .attr("height", bbox.height + 8)
          .style("fill", "#ddd")
          .style("fill-opacity", ".9");
        }
    },

    // remove circle that acts like a highlight on hover
    removeHover: function() {
      this.hoverContainer.selectAll(".hover-graphic").remove();
    },

    // add a circle that will act like a highlight when a circle is clicked on
    select: function(d) {
      if (d.attributes.cnstrct_yr > 1899) {
      var elem = d3.select("#id-" + d.attributes.objectid);
      this.selectContainer.append("circle")
        .attr("class", "selectedGraphic")
        .attr("r", 8)
        .attr("cx", parseInt(elem.attr("cx"), 10))
        .attr("cy", parseInt(elem.attr("cy"), 10))
        .attr("stroke-width", 4)
        .attr("stroke", this.highlightColor)
        .attr("fill", "none");
      }
    },

    // remove circle that acts like a selection highlight
    deselect: function() {
      this.selectContainer.selectAll(".selectedGraphic").remove();
    },

    // color the buildings according to the new selected period
    updatePeriod: function(newPeriod, newCategory) {
      for (var i = 0; i < newPeriod.length; i++) {
        this.circles.filter(".construct-" + i)
          .attr("fill", function(d) {
            if (newCategory === "geplant") {
              if (newPeriod[i] === true) {
                if (d.attributes.cnstrct_yr > 2020) {
                  return "rgba(71, 181, 255, 0.8)";
                }
                else {
                  return "rgba(000, 112, 188, 0.8)";
                }
              }
              else {
                return "rgba(255, 255, 255, 0.8)";
              }
            }
            else {
              if (newPeriod[i] === true) {
                return "rgba(000, 112, 188, 0.8)";
              }
              else {
                return "rgba(255, 255, 255, 0.8)";
              }
            }
          });
      }
    },

    // set display:none to circles when the corresponding buildings are filtered out
    updateFilter: function(newFilter) {
      this.circles.attr("display", function(d) {
        if ((d.attributes.heightroof < newFilter[0]) || (d.attributes.heightroof > newFilter[1])) {
          return "none";
        }
        else {
          return "inline";
        }
      });
    },

    // change the points when a category is selected
    applyCategory: function(newCategory, newPeriod){
      if (newCategory === "all") {
        this.circles.attr("r",  function(d) {
            if (d.attributes.cnstrct_yr < 1900) {
              return 1
            }
            else {
              return 3.5
            };
          })
          .attr("opacity",  function(d) {
            if (d.attributes.cnstrct_yr < 1900) {
              return 0
            }
            else {
              return 1
            };
          })
          .attr("fill", function(d) {
            var i, ageMin = [1000, 1900, 1925, 1950, 1975, 2000], ageMax = [1899, 1924, 1949, 1974, 1999, 2025];
            for (i = 0; i < newPeriod.length; i++) {
              if  ((d.attributes.cnstrct_yr > (ageMin[i] - 1)) && (d.attributes.cnstrct_yr < (ageMax[i]+ 1))) {
                if  (newPeriod[i] === true){
                  return "rgba(000, 112, 188, 0.8)"
                }
                else {
                  return "rgba(255, 255, 255, 0.8)"
                }
              } 
            }
          })
      }
      else if (newCategory === "geplant") {
        this.circles.attr("fill", function(d) {
          var i, ageMin = [1000, 1900, 1925, 1950, 1975, 2000], ageMax = [1899, 1924, 1949, 1974, 1999, 2025];
          for (i = 0; i < newPeriod.length; i++) {
            if  ((d.attributes.cnstrct_yr > (ageMin[i] - 1)) && (d.attributes.cnstrct_yr < (ageMax[i]+ 1))) {
              if  (newPeriod[i] === true){
                if (d.attributes.cnstrct_yr > 2020) {
                  return "rgba(71, 181, 255, 0.8)";
                }
                else {
                  return "rgba(000, 112, 188, 0.8)";
                }
              }
              else {
                return "rgba(255, 255, 255, 0.8)"
              }
            } 
          }
        })
        .attr("opacity", function(d){
          if (d.attributes.cnstrct_yr < 1900) {
            return 0
          }
          else {
            return 1
          };
        })
        .attr("r",  function(d) {
          if (d.attributes.cnstrct_yr < 1900) {
            return 1
          }
          else {
            return 3.5
          };
        })
      }
      else {
        var property = (newCategory === "info") ? "wohnhochhaus" : "top20";
        this.circles.attr("opacity", function(d) {
          if (d.attributes[property] === 1) {
            return 1;
          }
          else {
            return 0;
          }
        })
        .attr("fill", function(d) {
          var i, ageMin = [1000, 1900, 1925, 1950, 1975, 2000], ageMax = [1899, 1924, 1949, 1974, 1999, 2025];
          for (i = 0; i < newPeriod.length; i++) {
            if  ((d.attributes.cnstrct_yr > (ageMin[i] - 1)) && (d.attributes.cnstrct_yr < (ageMax[i]+ 1))) {
              if  (newPeriod[i] === true){
                return "rgba(000, 112, 188, 0.8)"
              }
              else {
                return "rgba(255, 255, 255, 0.8)"
              }
            } 
          }
        })
        .attr("r", function(d) {
          if (d.attributes[property] === 1) {
            return 3.5;
          }
          else {
            return 0.1;
          }
        });
      }
    }
  });
});
