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

/********************************************
 * This class helps creating and updating
 * the timeline buttons under the heightGraph
 *******************************************/

define([
  "dojo/_base/declare",
  "dojo/dom",
  "dojo/dom-construct",
  "dojo/on"
], function(declare, dom, domCtr, on) {

  return declare(null, {

    constructor: function(container, settings, state) {
      //Erstellung und Beschriftung der Button. if-Funktion zur Beschriftung des ersten, "vor 1900"-Buttons. 
      this.settings = settings;
      for (var i = 0; i < settings.initPeriod.length; i++) {
        if (i===0) {
          var Pfeil = domCtr.create("button", {id: "Pfeil"}, dom.byId(container));
          on(Pfeil, "click", togglePeriod(i));
          var button = domCtr.create("button", {id: "period-" + i, innerHTML:  "vor 1900"}, dom.byId(container));
          on(button, "click", togglePeriod(i));
        } 
        else {
          button = domCtr.create("button", {id: "period-" + i, innerHTML: settings.ageClasses[i].minValue + " - " + settings.ageClasses[i].maxValue}, dom.byId(container));
          on(button, "click", togglePeriod(i));
          }
      }


      function togglePeriod(j) {
        return function() {
          var newPeriod = [];
          for (var i = 0; i < settings.initPeriod.length; i++) {
            newPeriod[i] = (i !== j) ? state.selectedPeriod[i] : !state.selectedPeriod[i];
          }
          state.selectedPeriod = newPeriod;
        };
      } 
    },

    update: function(newPeriod) {
      var buttonStyle, PfeilStyle;
        for (var i = 0; i < newPeriod.length; i++) {
          if (i===0)  {
            PfeilStyle = dom.byId("Pfeil").style;
            PfeilStyle.borderRightColor = newPeriod[i] ? "rgb(000, 112, 188)" : "rgba(" + this.settings.defaultColor.join(",") + ")";
            buttonStyle = dom.byId("period-" + i).style;
            buttonStyle.backgroundColor = newPeriod[i] ? "rgb(" + this.settings.ageClasses[i].color.join(",") + ")" : "rgba(" + this.settings.defaultColor.join(",") + ")";
            buttonStyle.color = newPeriod[i] ? "#fff" : "#777";
          }
          else {
            buttonStyle = dom.byId("period-" + i).style;
            buttonStyle.backgroundColor = newPeriod[i] ? "rgb(" + this.settings.ageClasses[i].color.join(",") + ")" : "rgba(" + this.settings.defaultColor.join(",") + ")";
            buttonStyle.color = newPeriod[i] ? "#fff" : "#777";
          }
        }
      
    },

    //Deaktivierung des Zeitselektion bei aktivierten Category-Buttons
    /*applyCategory: function(selectedCategory) {
      if (selectedCategory !== "all") {
        for (var i = 0; i < 6; i++) {
          buttonStyle = dom.byId("period-" + i).style;
          buttonStyle.backgroundColor = "rgb(" + this.settings.ageClasses[i].color.join(",") + ")";
          buttonStyle.color = "#fff";
        }
      }
      else {
        for (var i = 0; i < 6; i++) {
          buttonStyle = dom.byId("period-" + i).style;
          buttonStyle.backgroundColor = newPeriod[i] ? "rgb(" + this.settings.ageClasses[i].color.join(",") + ")" : "rgba(" + this.settings.defaultColor.join(",") + ")";
          buttonStyle.color = newPeriod[i] ? "#fff" : "#777";
        }
      }
    }*/
  });
});
