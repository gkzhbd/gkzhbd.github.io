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

/*****************************************
 * This class is helps generating renderers
 * for the building scene layer depending
 * on the user choices
 **************************************/

define([
  "dojo/_base/declare",

  "esri/symbols/MeshSymbol3D",
  "esri/symbols/FillSymbol3DLayer",
  "esri/renderers/ClassBreaksRenderer",
  "esri/renderers/UniqueValueRenderer",
  "esri/symbols/PointSymbol3D",
  "esri/symbols/IconSymbol3DLayer"
], function(declare,
  MeshSymbol3D, FillSymbol3DLayer, ClassBreaksRenderer, UniqueValueRenderer,
  PointSymbol3D, IconSymbol3DLayer) {

  return declare(null, {

    constructor: function(settings, layer, field, state) {
      this.defaultColor = settings.defaultColor;
      this.ageClasses = settings.ageClasses;
      this.layer = layer;
      this.field = field;
      this.state = state;
    },

    // Definiton für das Rendering der hervorgehobenen Häusern
    createClassBreakInfos: function(selectedPeriod) {
      return this.ageClasses.map(function(e, i) {
        var color = selectedPeriod[i] ? e.color : this.defaultColor;
        return {
          minValue: e.minValue,
          maxValue: e.maxValue,
          symbol: new MeshSymbol3D({
            symbolLayers: [new FillSymbol3DLayer({
              material: {
                color: color
              },
			        edges: {
                type: "solid",
                size: 1,
                color: [0, 0, 0, 0.5]
			        }
            })]
          })
        };
      }.bind(this));
    },

    // Rendering
    applyClassBreaksRenderer: function(selectedPeriod) {
      //Generelles Rendering
      var symbol = new MeshSymbol3D({
        symbolLayers: [ new FillSymbol3DLayer({
          material: { color: this.defaultColor},
          edges: {
            type: "solid",
            size: 1,
            color: [0, 0, 0, 0.5]
          }
        })]
      });
      
      
      

      //Rendering für hervorgehobene Häuser, Definition von oben wird angewandt
      this.layer.renderer = new ClassBreaksRenderer({
        field: this.field,
        defaultSymbol: symbol,
        classBreakInfos: this.createClassBreakInfos(selectedPeriod)
      });


      this.applyCategory(this.state.selectedCategory, this.state.selectedPeriod);
    },


  //Spezialrenderer fuer Kategorieauswahl (rechter Rand). Falls Button gewählt wird, werden die oberen Renderer entsprechend den Einstellung des Spezialrenderers übersteuert.
    applyCategory: function(category, newPeriod) {
      var field, renderer = this.layer.renderer.clone(), expression;
      if (category === "all") {
        renderer.visualVariables = null;
      }
      else if (category === "geplant") {
        field = "CNSTRCT_YR"
        expression =  `
          if (($feature.cnstrct_yr >` + (this.ageClasses[0].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[0].maxValue + 1) + `))
            {` + newPeriod[0] + ` * $feature.` + field + `}
          else if (($feature.cnstrct_yr >` + (this.ageClasses[1].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[1].maxValue + 1) + `))
            {` + newPeriod[1] + ` * $feature.` + field + `}
          else if (($feature.cnstrct_yr >` + (this.ageClasses[2].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[2].maxValue + 1) + `))
            {` + newPeriod[2] + ` * $feature.` + field + `}
          else if (($feature.cnstrct_yr >` + (this.ageClasses[3].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[3].maxValue + 1) + `))
            {` + newPeriod[3] + ` * $feature.` + field + `}
          else if (($feature.cnstrct_yr >` + (this.ageClasses[4].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[4].maxValue + 1) + `))
            {` + newPeriod[4] + ` * $feature.` + field + `}
          else if (($feature.cnstrct_yr >` + (this.ageClasses[5].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[5].maxValue + 1) + `))
            {` + newPeriod[5] + ` * $feature.` + field + `}`
            
        renderer.visualVariables = [{
          type: "color",
          valueExpression: expression,
          stops: [{
            value: 1,
            color: this.defaultColor
          },{
            value: 2,
            color: [000, 112, 188]
          },{
            value: 2019,
            color: [000, 112, 188]
          },{
            value: 2020,
            color: [71, 181, 255]
          }]
        }];
      }

      else {
        if (category === "info") {
          field = "wohnhochhaus"
          expression = `
            if (($feature.cnstrct_yr >` + (this.ageClasses[0].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[0].maxValue + 1) + `))
              {` + newPeriod[0] + ` * $feature.` + field + `}
            else if (($feature.cnstrct_yr >` + (this.ageClasses[1].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[1].maxValue + 1) + `))
              {` + newPeriod[1] + ` * $feature.` + field + `}
            else if (($feature.cnstrct_yr >` + (this.ageClasses[2].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[2].maxValue + 1) + `))
              {` + newPeriod[2] + ` * $feature.` + field + `}
            else if (($feature.cnstrct_yr >` + (this.ageClasses[3].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[3].maxValue + 1) + `))
              {` + newPeriod[3] + ` * $feature.` + field + `}
            else if (($feature.cnstrct_yr >` + (this.ageClasses[4].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[4].maxValue + 1) + `))
              {` + newPeriod[4] + ` * $feature.` + field + `}
            else if (($feature.cnstrct_yr >` + (this.ageClasses[5].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[5].maxValue + 1) + `))
              {` + newPeriod[5] + ` * $feature.` + field + `}`
        }
        else {
          field = "top20";
          expression = `
            if (($feature.cnstrct_yr >` + (this.ageClasses[0].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[0].maxValue + 1) + `))
              {` + newPeriod[0] + ` * $feature.` + field + `}
            else if (($feature.cnstrct_yr >` + (this.ageClasses[1].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[1].maxValue + 1) + `))
              {` + newPeriod[1] + ` * $feature.` + field + `}
            else if (($feature.cnstrct_yr >` + (this.ageClasses[2].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[2].maxValue + 1) + `))
              {` + newPeriod[2] + ` * $feature.` + field + `}
            else if (($feature.cnstrct_yr >` + (this.ageClasses[3].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[3].maxValue + 1) + `))
              {` + newPeriod[3] + ` * $feature.` + field + `}
            else if (($feature.cnstrct_yr >` + (this.ageClasses[4].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[4].maxValue + 1) + `))
              {` + newPeriod[4] + ` * $feature.` + field + `}
            else if (($feature.cnstrct_yr >` + (this.ageClasses[5].minValue - 1) + `) && ($feature.cnstrct_yr < ` + (this.ageClasses[5].maxValue + 1) + `))
              {` + newPeriod[5] + ` * $feature.` + field + `}`
        }
        renderer.visualVariables = [{
          type: "color",
          valueExpression: expression, //valueExpression defines the building that should be rendered. It has to be an Arcade-Expression within a string --> https://developers.arcgis.com/javascript/latest/guide/arcade/index.html
          stops: [{
            value: 0,
            color: this.defaultColor
          }, {
            value: 1,
            color: [000, 112, 188]
          }]
        }];
      }
      this.layer.renderer = renderer;
    },

    /*createUniqueValueRenderer: function(field, uniqueValues) {

      return new UniqueValueRenderer({
        field: field,
        uniqueValueInfos: [{
          value: uniqueValues.value,
          symbol: new PointSymbol3D({
            symbolLayers: [new IconSymbol3DLayer({
              size: 18,  // points
              resource: {
                href: uniqueValues.image
               }
            })],
            verticalOffset: {
              screenLength: 80,
              maxWorldLength: 100
            },
            callout: {
              type: "line",
              size: 5,
              color: [50, 50, 50],
              border: {
                color: [255, 0, 0]
              }
            }
          })
        }]
      });
    }*/

  });
});
